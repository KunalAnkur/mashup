import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSocket } from "@/context/SocketContext";
import { useRoomContext } from "@/context/RoomContext";
import { SocketEvent } from "@/types/socketEvents";
import { showError } from "@/utils/toast";
import { useTranslations } from "@/i18n/I18nProvider";
import { getUserMediaStream } from "@/utils/helper";
import { usePeerMesh } from "@/hooks/usePeerMesh";
import type { CallActions, CallParticipant } from "@/hooks/useAudioVideoCall";

export interface UseP2PCallParams {
  roomId: string | null;
  /** Only true for a Couple room — Crowd uses the SFU hook, free tier has no calls. */
  enabled: boolean;
  localStreamRef: React.MutableRefObject<MediaStream | null>;
  onLocalStream: (stream: MediaStream | null) => void;
  onParticipantUpdate: (
    socketId: string,
    updater: (prev: CallParticipant | undefined) => Partial<CallParticipant>
  ) => void;
  onParticipantRemove: (socketId: string) => void;
  onJoined: () => void;
  onLeft: (opts?: { keepRemoteParticipants?: boolean }) => void;
}

type CallJoinAck = {
  success?: boolean;
  error?: string;
  callMode?: "sfu" | "p2p";
  iceServers?: RTCIceServer[];
  existingParticipants?: { socketId: string; username: string; profile?: string }[];
};

const DEFAULT_ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

/**
 * Peer-to-peer audio/video call, for Couple rooms.
 *
 * Exposes exactly the `CallActions` surface that `useAudioVideoCall` does, so `CallStreamContext`
 * can pick between them purely on the room's delivery mode and nothing downstream — the call
 * overlay, the participant tiles, the mic and camera buttons — needs to know which one is live.
 *
 * All of the WebRTC work lives in `PeerMesh`. What is left here is the part that is genuinely
 * about calling: acquiring the camera and microphone, tracking who is in the call as opposed to
 * who is merely in the room, and mapping each peer's incoming stream onto a participant tile.
 *
 * Two participants means one connection, which is the entire reason a Couple room does not need
 * the SFU: no server sees the media, so the plan costs nothing to run beyond signalling.
 */
export function useP2PCall({
  roomId,
  enabled,
  localStreamRef,
  onLocalStream,
  onParticipantUpdate,
  onParticipantRemove,
  onJoined,
  onLeft,
}: UseP2PCallParams): CallActions {
  const { socket } = useSocket();
  const { participants } = useRoomContext();
  const tToast = useTranslations("toast");

  /** Socket ids of everyone currently publishing their own camera or mic. */
  const [publisherIds, setPublisherIds] = useState<string[]>([]);
  const [iceServers, setIceServers] = useState<RTCIceServer[]>(DEFAULT_ICE_SERVERS);
  const inCallRef = useRef(false);
  /** Mirrors `inCallRef` as state, because the mesh's enablement has to re-render on it. */
  const [isPublishing, setIsPublishing] = useState(false);

  // Everyone else in the ROOM, which is who we may need a connection with — deliberately not
  // "everyone publishing".
  //
  // Publisher notifications only fire for people who start a camera, so a caller is never told
  // that a silent watcher exists. Keying the mesh off publishers left the caller with an empty
  // peer list, its mesh switched off, and not even listening for the watcher's offer — so the
  // call only connected once *both* sides published. Room membership is symmetric: both ends
  // see each other, and the one that should offer is decided by comparing ids.
  const roomPeerIds = useMemo(
    () =>
      participants
        .map((p) => p.socketId)
        .filter((id): id is string => !!id && id !== socket?.id),
    [participants, socket?.id]
  );

  // Nobody needs a connection until someone is actually on a call.
  const callActive = isPublishing || publisherIds.length > 0;

  // Read from inside mesh callbacks, which can fire during teardown — after the render that
  // changed this state but before the next one.
  const publisherIdsRef = useRef(publisherIds);
  publisherIdsRef.current = publisherIds;

  // Read by the mesh through stable closures, so joining does not rebuild it.
  const onParticipantUpdateRef = useRef(onParticipantUpdate);
  onParticipantUpdateRef.current = onParticipantUpdate;
  const onParticipantRemoveRef = useRef(onParticipantRemove);
  onParticipantRemoveRef.current = onParticipantRemove;

  // ── Transport ──────────────────────────────────────────────────────────────

  const mesh = usePeerMesh({
    // Up as soon as anyone is on a call, on both sides, whether or not we have joined
    // ourselves. Watching a caller and being one are different things: in a mesh you still
    // need a peer connection to receive. Until we publish we simply have no local tracks,
    // which the mesh opens as a receive-only connection.
    enabled: enabled && callActive && roomPeerIds.length > 0,
    events: {
      offer: SocketEvent.CALL_P2P_OFFER,
      answer: SocketEvent.CALL_P2P_ANSWER,
      ice: SocketEvent.CALL_P2P_ICE,
    },
    direction: "sendrecv",
    peerIds: roomPeerIds,
    iceServers,
    // Both sides of a pair can offer, so exactly one must open the connection or they collide
    // on every join. Comparing ids is arbitrary but consistent, and both ends compute the same
    // answer from the same two values.
    shouldInitiateTo: (peerId) => (socket?.id ?? "") < peerId,
    // The complement, so the two ends never both yield or both dig in.
    isPoliteWith: (peerId) => (socket?.id ?? "") > peerId,
    getLocalTracks: () => localStreamRef.current?.getTracks() ?? null,
    onRemoteStream: (peerId, stream) => {
      onParticipantUpdateRef.current(peerId, () => ({ stream }));
    },
    onPeerClosed: (peerId) => {
      // A connection can close for two very different reasons, and they need opposite handling.
      //
      // If the peer is still publishing, this was a blip: keep their tile and drop the stale
      // stream so it reconnects cleanly. If they are not, the call is over for them and the
      // tile must go — updating instead would *recreate* it, because the context's updater
      // inserts a participant it does not already have. That is what left empty tiles behind
      // when everyone hung up: teardown ran after the roster had already been cleared, and
      // resurrected a placeholder for every peer it closed.
      if (publisherIdsRef.current.includes(peerId)) {
        onParticipantUpdateRef.current(peerId, () => ({ stream: undefined }));
      } else {
        onParticipantRemoveRef.current(peerId);
      }
    },
    logPrefix: "[P2P:call]",
  });

  // ── Call roster ────────────────────────────────────────────────────────────
  //
  // Tracked here as well as in CallStreamContext because the two need it for different things:
  // the context renders tiles from it, the mesh opens connections from it. Sharing one copy
  // would couple the transport to render state for no benefit.

  useEffect(() => {
    if (!enabled || !socket || !roomId) return;

    // Deliberately not gated on being in the call ourselves — this is precisely the case where
    // someone starts their camera and everyone else should see it without acting.
    const onParticipantJoined = (data: { socketId: string }) => {
      if (!data.socketId) return;
      setPublisherIds((prev) =>
        prev.includes(data.socketId) ? prev : [...prev, data.socketId]
      );
    };

    const onParticipantLeft = (data: { socketId: string }) => {
      setPublisherIds((prev) => prev.filter((id) => id !== data.socketId));
      onParticipantRemoveRef.current(data.socketId);
    };

    socket.on(SocketEvent.CALL_PARTICIPANT_JOINED, onParticipantJoined);
    socket.on(SocketEvent.CALL_PARTICIPANT_LEFT, onParticipantLeft);

    return () => {
      socket.off(SocketEvent.CALL_PARTICIPANT_JOINED, onParticipantJoined);
      socket.off(SocketEvent.CALL_PARTICIPANT_LEFT, onParticipantLeft);
    };
  }, [enabled, socket, roomId]);

  /**
   * Ask who is already on a call when we enter the room.
   *
   * `CALL_PARTICIPANT_JOINED` only fires for people who start *after* us, so without this a
   * caller already in progress would stay invisible until they toggled their camera. Sent
   * receive-only so it reports the roster without registering us as a publisher — the same
   * attach-to-watch step the SFU path performs.
   */
  const attachedRef = useRef(false);
  useEffect(() => {
    if (!enabled || !socket || !roomId || attachedRef.current) return;
    attachedRef.current = true;

    let cancelled = false;
    void (async () => {
      try {
        const ack: CallJoinAck = await socket.emitWithAck(SocketEvent.CALL_JOIN, {
          roomId,
          receiveOnly: true,
        });
        if (cancelled || !ack?.success || ack.callMode !== "p2p") return;

        if (ack.iceServers?.length) setIceServers(ack.iceServers);

        const existing = ack.existingParticipants ?? [];
        for (const participant of existing) {
          onParticipantUpdateRef.current(participant.socketId, () => ({
            username: participant.username,
            profile: participant.profile,
          }));
        }
        if (existing.length) {
          setPublisherIds((prev) => {
            const merged = new Set([...prev, ...existing.map((p) => p.socketId)]);
            return Array.from(merged);
          });
        }
      } catch (error) {
        // Watching is best-effort. Failing here must not stop us starting our own call.
        console.warn("[P2P:call] Could not attach to watch existing callers:", error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, socket, roomId]);

  useEffect(() => {
    if (!enabled) attachedRef.current = false;
  }, [enabled]);

  // ── Actions ────────────────────────────────────────────────────────────────

  const joinCall = useCallback(
    async (opts?: { micOn?: boolean; cameraOn?: boolean }) => {
      if (!enabled || !socket || !roomId || inCallRef.current) return;

      const micOn = opts?.micOn !== false;
      const cameraOn = opts?.cameraOn !== false;

      let stream: MediaStream | null = null;
      try {
        // Ask for exactly what was chosen. Requesting the camera for an audio-only call would
        // prompt for a device the user never asked to use, and — worse — refusing or lacking
        // one would fail the whole call. Turning the camera on later goes through
        // `ensureTrack`, which acquires and publishes it then.
        //
        // The audio fallback covers the degenerate "neither" case, so we never call
        // getUserMedia asking for nothing, which throws.
        stream = await getUserMediaStream({
          audio: micOn || !cameraOn,
          video: cameraOn,
        });
      } catch (error) {
        console.error("[P2P:call] Failed to get camera/microphone:", error);
        showError(tToast("failedToConnect"), tToast("checkInternetConnection"));
        return;
      }
      if (!stream) {
        showError(tToast("failedToConnect"), tToast("tryAgain"));
        return;
      }

      // Whatever we did acquire starts in the state the user picked.
      stream.getAudioTracks().forEach((t) => (t.enabled = micOn));
      stream.getVideoTracks().forEach((t) => (t.enabled = cameraOn));

      localStreamRef.current = stream;
      onLocalStream(stream);

      try {
        const ack: CallJoinAck = await socket.emitWithAck(SocketEvent.CALL_JOIN, {
          roomId,
          initialMicOn: micOn,
          initialCameraOn: cameraOn,
          receiveOnly: false,
        });

        if (!ack?.success) {
          throw new Error(ack?.error || "Call join was refused");
        }
        if (ack.callMode !== "p2p") {
          // The server decided this room is SFU after all. Bail rather than half-connect —
          // CallStreamContext picks the hook from the room's mode, so this means they disagree.
          throw new Error(`Server returned callMode="${ack.callMode}" for a P2P call`);
        }

        if (ack.iceServers?.length) setIceServers(ack.iceServers);

        // Seed the tiles for people already in the call, so they appear immediately rather
        // than only once their media arrives.
        for (const participant of ack.existingParticipants ?? []) {
          onParticipantUpdateRef.current(participant.socketId, () => ({
            username: participant.username,
            profile: participant.profile,
          }));
        }

        inCallRef.current = true;
        setIsPublishing(true);
        // Union, not replace: we may already be watching people from the receive-only attach,
        // and dropping them here would close connections that are working.
        setPublisherIds((prev) => {
          const merged = new Set([
            ...prev,
            ...(ack.existingParticipants ?? []).map((p) => p.socketId),
          ]);
          return Array.from(merged);
        });
        onJoined();

        // Connections opened while we were only watching carry no tracks of ours. Publishing
        // into them adds our senders and triggers renegotiation, which is what turns a
        // one-way view into a two-way call without tearing anything down.
        void mesh.replaceLocalTracks();
      } catch (error) {
        console.error("[P2P:call] Join failed:", error);
        stream.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
        onLocalStream(null);
        showError(
          tToast("failedToConnect"),
          error instanceof Error ? error.message : tToast("tryAgain")
        );
      }
    },
    [enabled, socket, roomId, localStreamRef, onLocalStream, onJoined, tToast, mesh]
  );

  const leaveCall = useCallback(() => {
    if (!inCallRef.current) return;
    inCallRef.current = false;
    setIsPublishing(false);

    // Whether anyone else is still on the call decides how much of this teardown applies:
    // stopping our own camera while the other person keeps theirs on should leave us watching
    // them, exactly as if we had never joined.
    const othersStillCalling = publisherIdsRef.current.some((id) => id !== socket?.id);

    if (socket && roomId) {
      // `keepReceiving` stops us publishing without detaching us from the call, so the server
      // still reports us in the room and the other side keeps its connection to us.
      socket.emit(SocketEvent.CALL_LEAVE, { roomId, keepReceiving: othersStillCalling });
    }

    // Deliberately does NOT clear the publisher roster: the other person may still be on the
    // call, and we should keep watching them exactly as we would had we never joined.
    setPublisherIds((prev) => prev.filter((id) => id !== socket?.id));

    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    onLocalStream(null);

    // Only wipe the tiles when there is genuinely nobody left to show. Clearing them while
    // someone is still on camera would drop a participant we are actively receiving.
    onLeft({ keepRemoteParticipants: othersStillCalling });
  }, [socket, roomId, localStreamRef, onLocalStream, onLeft]);

  /**
   * Add a device we did not request at join time and publish it mid-call.
   *
   * Because the call only asks for what the user chose, an audio-only call has no video track
   * at all — so turning the camera on is genuinely adding media, not un-muting it. Publishing
   * through the mesh reuses the receive-only transceiver the other side already negotiated
   * where one exists, and otherwise adds a sender; either way the browser raises
   * `negotiationneeded` and the mesh re-offers.
   */
  const ensureTrack = useCallback(
    async (kind: "audio" | "video"): Promise<MediaStreamTrack | null> => {
      const stream = localStreamRef.current;
      if (!stream) return null;

      const existing =
        kind === "video" ? stream.getVideoTracks()[0] : stream.getAudioTracks()[0];
      if (existing) return existing;

      const fresh = await getUserMediaStream(
        kind === "video" ? { video: true, audio: false } : { audio: true, video: false }
      );
      const track = fresh?.getTracks().find((t) => t.kind === kind) ?? null;
      if (!track) {
        console.warn(`[P2P:call] Could not acquire ${kind}`);
        return null;
      }

      stream.addTrack(track);
      await mesh.replaceLocalTracks();
      console.log(`[P2P:call] Published ${kind} mid-call`);
      return track;
    },
    [localStreamRef, mesh]
  );

  // Mic and camera are pure track toggles. CallStreamContext owns the flags and broadcasts the
  // state change; this only has to flip the track, and because the track stays in the sender
  // there is nothing to renegotiate.
  const toggleMic = useCallback(() => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (track) track.enabled = !track.enabled;
  }, [localStreamRef]);

  const toggleCamera = useCallback(() => {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (track) track.enabled = !track.enabled;
  }, [localStreamRef]);

  // Leaving the room, or the room turning out not to be P2P, must not strand an open call.
  useEffect(() => {
    if (enabled) return;
    if (inCallRef.current) leaveCall();
  }, [enabled, leaveCall]);

  // No effect re-publishes tracks here on purpose: the mesh reads `getLocalTracks()` when it
  // opens each connection, and a call's local stream only changes on join and leave. If device
  // switching mid-call is added later, call `mesh.replaceLocalTracks()` from that action rather
  // than from an effect — the returned object is stable, so an effect keyed on it would run
  // once and never again, which reads as working while doing nothing.
  void mesh;

  return { joinCall, leaveCall, toggleMic, toggleCamera, ensureTrack };
}
