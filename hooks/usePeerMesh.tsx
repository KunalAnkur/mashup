import { useEffect, useMemo, useRef } from "react";
import { useSocket } from "@/context/SocketContext";
import { PeerMesh } from "@/lib/webrtc/PeerMesh";
import type { PeerDirection } from "@/lib/webrtc/PeerMesh";

/**
 * The socket event names a feature uses to carry SDP and ICE. Streaming and calling use
 * different ones so their negotiations never cross.
 */
export interface PeerMeshEvents {
  offer: string;
  answer: string;
  ice: string;
}

export interface UsePeerMeshOptions {
  /** Nothing is created while false. Flipping it off tears the mesh down. */
  enabled: boolean;
  events: PeerMeshEvents;
  direction: PeerDirection;
  /** Socket ids currently present for this feature. */
  peerIds: string[];
  iceServers: RTCIceServer[];
  shouldInitiateTo(peerId: string): boolean;
  isPoliteWith?(peerId: string): boolean;
  getLocalTracks(): MediaStreamTrack[] | null;
  onRemoteStream?(peerId: string, stream: MediaStream): void;
  onPeerClosed?(peerId: string): void;
  onConnectionState?(peerId: string, state: RTCPeerConnectionState): void;
  logPrefix?: string;
}

/**
 * React binding for `PeerMesh`.
 *
 * Deliberately thin. All this does is create the mesh, forward socket events into it, and push
 * roster/identity changes at it — the negotiation itself lives in the class, where effect
 * ordering and Strict Mode cannot reorder it.
 *
 * Every option is read through a ref so the mesh is never rebuilt by a re-render. The single
 * thing that legitimately rebuilds it is our own socket id changing, which is a reconnect, and
 * that is handled inside the mesh rather than by remounting it.
 */
export function usePeerMesh(options: UsePeerMeshOptions) {
  const { socket } = useSocket();
  const meshRef = useRef<PeerMesh | null>(null);

  // Callbacks change identity on nearly every render. Routing them through a ref keeps the
  // mesh's lifetime tied to the connection rather than to React's render cycle — the mistake
  // that made the previous P2P code tear down live connections on unrelated state changes.
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const { enabled, events } = options;

  useEffect(() => {
    if (!enabled || !socket) return;

    const mesh = new PeerMesh({
      selfId: socket.id ?? null,
      iceServers: optionsRef.current.iceServers,
      direction: optionsRef.current.direction,
      shouldInitiateTo: (peerId) => optionsRef.current.shouldInitiateTo(peerId),
      isPoliteWith: (peerId) => optionsRef.current.isPoliteWith?.(peerId) ?? false,
      getLocalTracks: () => optionsRef.current.getLocalTracks(),
      onRemoteStream: (peerId, stream) =>
        optionsRef.current.onRemoteStream?.(peerId, stream),
      onPeerClosed: (peerId) => optionsRef.current.onPeerClosed?.(peerId),
      onConnectionState: (peerId, state) =>
        optionsRef.current.onConnectionState?.(peerId, state),
      signaling: {
        sendOffer: (peerId, description) =>
          socket.emit(events.offer, { targetPeerId: peerId, offer: description }),
        sendAnswer: (peerId, description) =>
          socket.emit(events.answer, { targetPeerId: peerId, answer: description }),
        sendIce: (peerId, candidate) =>
          socket.emit(events.ice, { targetPeerId: peerId, candidate }),
      },
      logPrefix: optionsRef.current.logPrefix,
    });
    meshRef.current = mesh;

    const onOffer = (data: { fromPeerId: string; offer: RTCSessionDescriptionInit }) => {
      void mesh.handleOffer(data.fromPeerId, data.offer);
    };
    const onAnswer = (data: { fromPeerId: string; answer: RTCSessionDescriptionInit }) => {
      void mesh.handleAnswer(data.fromPeerId, data.answer);
    };
    const onIce = (data: { fromPeerId: string; candidate: RTCIceCandidateInit }) => {
      void mesh.handleIce(data.fromPeerId, data.candidate);
    };

    socket.on(events.offer, onOffer);
    socket.on(events.answer, onAnswer);
    socket.on(events.ice, onIce);

    // A reconnect reuses the same Socket instance and only swaps `id`, so no dependency here
    // would ever notice it. Listening for `connect` is the one reliable signal that our
    // identity changed and every remote peer is now holding a dead connection to us.
    const onReconnect = () => mesh.setSelfId(socket.id ?? null);
    socket.on("connect", onReconnect);

    mesh.setPeers(optionsRef.current.peerIds);

    return () => {
      socket.off(events.offer, onOffer);
      socket.off(events.answer, onAnswer);
      socket.off(events.ice, onIce);
      socket.off("connect", onReconnect);
      mesh.close();
      meshRef.current = null;
    };
  }, [enabled, socket, events.offer, events.answer, events.ice]);

  // Roster changes are pushed in, not rebuilt around.
  useEffect(() => {
    meshRef.current?.setPeers(options.peerIds);
  }, [options.peerIds]);

  useEffect(() => {
    meshRef.current?.setIceServers(options.iceServers);
  }, [options.iceServers]);

  // Memoised with no dependencies: every method reaches the mesh through a ref, so the object
  // never needs to change identity. A fresh object each render would silently re-run any
  // consumer effect that depends on it — the sort of thing that looks harmless and turns into
  // renegotiating the whole mesh on unrelated state changes.
  return useMemo(
    () => ({
      /** Swap outgoing tracks on every open connection, without renegotiating. */
      replaceLocalTracks: () => meshRef.current?.replaceLocalTracks(),
      getConnectionState: (peerId: string) =>
        meshRef.current?.getConnectionState(peerId) ?? null,
      getPeerIds: () => meshRef.current?.getPeerIds() ?? [],
    }),
    []
  );
}
