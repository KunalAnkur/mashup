"use client";

/**
 * The media capability, built for the one game in this room that asked for it.
 *
 * Constructed here rather than inside `ActivitySurface` for the same reason the session
 * is: a peer connection is the host app's business. Whether this room is peer-to-peer
 * or on the SFU, which ICE servers it may use, and what the viewer's plan permits are
 * all facts arcade must not need to know — so the platform builds the port and the game
 * receives an interface.
 *
 * Absent unless the manifest asks. A game that never declared `use-media` gets
 * `sdk.media === undefined`, which is the capability model working: asking is what
 * grants it, and no game can reach a connection it did not declare.
 *
 * Two implementations, chosen from the room's delivery mode and never swapped — see
 * `useSfu` below. The game receives a `MediaPort` and cannot tell which it got.
 */

import { useEffect, useRef, useState } from "react";
import { gameNeedsCapability, type MediaPort } from "@movmash/arcade-client";

import { useSelector } from "react-redux";

import { RootState } from "@/lib/store";
import { useSocket } from "@/context/SocketContext";
import { useRoomContext } from "@/context/RoomContext";
import { P2PMediaPort } from "@/lib/activity/media/P2PMediaPort";
import { SfuMediaPort } from "@/lib/activity/media/SfuMediaPort";

/** Used only until the server's announce reply supplies its own, with TURN. */
const FALLBACK_ICE: RTCIceServer[] = [{ urls: "stun:stun.l.google.com:19302" }];

export function useActivityMedia(gameId: string | null, selfUserId: string): MediaPort | null {
  const { socket } = useSocket();
  const { isJoined, joinResponse, streamDeliveryMode } = useRoomContext();
  const isRoomHost = useSelector((state: RootState) => state.room.host);

  const roomId = joinResponse?.roomId ?? null;
  const wanted = gameId ? gameNeedsCapability(gameId, "use-media") : false;

  /**
   * Which way the picture travels, decided once and never changed.
   *
   * The room's own delivery mode, set from the host's tier when they opened it — a
   * Couple room is peer-to-peer from the first frame and a Crowd room is on the SFU
   * from the first frame. Using the room's answer rather than a count of who is
   * present is what makes it fixed: a third person arriving must not re-plumb a
   * running game, and a spectator leaving must not drop it back to peer-to-peer.
   *
   * Defaults to peer-to-peer when the room never said, which is the conservative
   * answer: a two-person room works on either path, and the SFU is the one that needs
   * a router allocated for it.
   */
  const useSfu = streamDeliveryMode === "sfu";

  // The port is a long-lived object with a socket subscription, so it is built in an
  // effect and *reported* through state. Returning `ref.current` directly would hand
  // back null on the render that creates it and never re-render to correct itself.
  const portRef = useRef<MediaPort & { dispose(): void } | null>(null);
  const [port, setPort] = useState<MediaPort | null>(null);

  useEffect(() => {
    if (!wanted || !socket || !roomId || !selfUserId || !isJoined) return;
    if (portRef.current) return;

    const iceServers = joinResponse?.iceServers?.length ? joinResponse.iceServers : FALLBACK_ICE;

    // Both implementations are permanent and the game cannot tell them apart. The only
    // decision here is which one this room is on.
    const created = useSfu
      ? new SfuMediaPort({ socket, roomId, iceServers, selfUserId, isHost: isRoomHost })
      : new P2PMediaPort({ socket, roomId, iceServers, selfUserId });

    portRef.current = created;
    setPort(created);
  }, [wanted, socket, roomId, selfUserId, isJoined, joinResponse?.iceServers, useSfu, isRoomHost]);

  /**
   * Torn down when the game changes or this surface goes away — never on a dropped
   * socket.
   *
   * `isJoined` flips false on a blip and the port is built to survive exactly that: it
   * re-announces on reconnect and re-addresses its peers rather than rebuilding them.
   * Disposing on `isJoined` would throw away a connection that was recovering, which is
   * the opposite of the point.
   */
  useEffect(() => {
    return () => {
      portRef.current?.dispose();
      portRef.current = null;
      setPort(null);
    };
    // `useSfu` is in here as well as `gameId` for completeness, not because it moves:
    // a room's delivery mode is fixed for its whole life. If it ever did change, the
    // right response really would be to tear the old port down and build the other.
  }, [gameId, useSfu]);

  return wanted ? port : null;
}
