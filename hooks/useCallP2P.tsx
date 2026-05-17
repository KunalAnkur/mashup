import { useEffect, useCallback, useRef } from "react";
import { useSocket } from "@/context/SocketContext";
import { SocketEvent } from "@/types/socketEvents";
import { showError } from "@/utils/toast";
import type { CallParticipant, CallStreamActions } from "@/context/CallStreamContext";

interface UseCallP2PParams {
  roomId: string | null;
  enabled: boolean;
  onLocalStream: (stream: MediaStream | null) => void;
  onRemoteParticipantUpdate: (socketId: string, updater: (prev: CallParticipant | undefined) => Partial<CallParticipant>) => void;
  onRemoteParticipantRemove: (socketId: string) => void;
  onCallJoined: () => void;
  onCallLeft: () => void;
  localStreamRef: React.MutableRefObject<MediaStream | null>;
}

const STUN_FALLBACK: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

export function useCallP2P({
  roomId,
  enabled,
  onLocalStream,
  onRemoteParticipantUpdate,
  onRemoteParticipantRemove,
  onCallJoined,
  onCallLeft,
  localStreamRef,
}: UseCallP2PParams): CallStreamActions {
  const { socket } = useSocket();

  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const iceServersRef = useRef<RTCIceServer[]>(STUN_FALLBACK);
  const joiningRef = useRef(false);
  const isInCallRef = useRef(false);

  // ─── helpers ────────────────────────────────────────────────────────────────

  const createPeerConnection = useCallback((peerId: string): RTCPeerConnection => {
    const pc = new RTCPeerConnection({ iceServers: iceServersRef.current });

    // Add local tracks
    localStreamRef.current?.getTracks().forEach((track) => {
      pc.addTrack(track, localStreamRef.current!);
    });

    // Forward ICE candidates to the remote peer
    pc.onicecandidate = (e) => {
      if (e.candidate && socket && roomId) {
        socket.emit(SocketEvent.CALL_P2P_ICE, {
          roomId, targetPeerId: peerId, candidate: e.candidate.toJSON(),
        });
      }
    };

    // When we receive a remote track, update that peer's stream
    const remoteStream = new MediaStream();
    pc.ontrack = (e) => {
      e.streams[0]?.getTracks().forEach((t) => remoteStream.addTrack(t));
      onRemoteParticipantUpdate(peerId, () => ({ stream: remoteStream }));
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "failed" || pc.connectionState === "closed") {
        peersRef.current.delete(peerId);
        onRemoteParticipantRemove(peerId);
      }
    };

    peersRef.current.set(peerId, pc);
    return pc;
  }, [socket, roomId, localStreamRef, onRemoteParticipantUpdate, onRemoteParticipantRemove]);

  const closeAllPeers = useCallback(() => {
    peersRef.current.forEach((pc) => pc.close());
    peersRef.current = new Map();
  }, []);

  // ─── joinCall ───────────────────────────────────────────────────────────────

  const joinCall = useCallback(async (): Promise<void> => {
    if (!socket || !roomId || !enabled || joiningRef.current || isInCallRef.current) return;
    joiningRef.current = true;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      onLocalStream(stream);

      const res = await socket.emitWithAck(SocketEvent.CALL_JOIN, { roomId });
      if (!res?.success || res.callMode !== "p2p") {
        stream.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
        onLocalStream(null);
        if (res?.callMode === "sfu") return; // handed off to SFU hook
        showError("Call failed", res?.error ?? "Could not join call");
        return;
      }

      if (res.iceServers?.length) iceServersRef.current = res.iceServers;

      isInCallRef.current = true;
      onCallJoined();

      // Initiate offer to every participant already in the call
      const existing: { socketId: string; username: string; profile?: string }[] =
        res.existingParticipants ?? [];

      for (const peer of existing) {
        const pc = createPeerConnection(peer.socketId);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit(SocketEvent.CALL_P2P_OFFER, {
          roomId, targetPeerId: peer.socketId, offer,
        });
      }
    } catch (e: any) {
      console.error("[CALL P2P] joinCall error:", e);
      showError("Call failed", e?.message ?? "Camera/microphone error");
      closeAllPeers();
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
      onLocalStream(null);
    } finally {
      joiningRef.current = false;
    }
  }, [socket, roomId, enabled, createPeerConnection, closeAllPeers,
      localStreamRef, onLocalStream, onCallJoined]);

  // ─── leaveCall ──────────────────────────────────────────────────────────────

  const leaveCall = useCallback((): void => {
    if (!socket || !roomId || !isInCallRef.current) return;
    socket.emit(SocketEvent.CALL_LEAVE, { roomId });
    closeAllPeers();
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    onLocalStream(null);
    isInCallRef.current = false;
    onCallLeft();
  }, [socket, roomId, closeAllPeers, localStreamRef, onLocalStream, onCallLeft]);

  // ─── controls ───────────────────────────────────────────────────────────────

  const toggleMic = useCallback((): void => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (track) track.enabled = !track.enabled;
  }, [localStreamRef]);

  const toggleCamera = useCallback((): void => {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (track) track.enabled = !track.enabled;
  }, [localStreamRef]);

  // ─── socket event listeners ──────────────────────────────────────────────────

  useEffect(() => {
    if (!socket || !enabled || !roomId) return;

    // A new participant joined the call — we initiate the offer to them
    const onParticipantJoined = async (data: { socketId: string; username: string; profile?: string }) => {
      if (!isInCallRef.current || data.socketId === socket.id) return;
      const pc = createPeerConnection(data.socketId);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit(SocketEvent.CALL_P2P_OFFER, {
        roomId, targetPeerId: data.socketId, offer,
      });
    };

    // Receive offer — respond with answer
    const onOffer = async (data: { fromPeerId: string; offer: RTCSessionDescriptionInit }) => {
      if (!isInCallRef.current) return;
      let pc = peersRef.current.get(data.fromPeerId);
      if (!pc) pc = createPeerConnection(data.fromPeerId);
      await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit(SocketEvent.CALL_P2P_ANSWER, {
        roomId, targetPeerId: data.fromPeerId, answer,
      });
    };

    const onAnswer = async (data: { fromPeerId: string; answer: RTCSessionDescriptionInit }) => {
      const pc = peersRef.current.get(data.fromPeerId);
      if (pc) await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
    };

    const onIce = async (data: { fromPeerId: string; candidate: RTCIceCandidateInit }) => {
      const pc = peersRef.current.get(data.fromPeerId);
      if (pc && data.candidate) {
        await pc.addIceCandidate(new RTCIceCandidate(data.candidate)).catch(() => {});
      }
    };

    const onParticipantLeft = (data: { socketId: string }) => {
      const pc = peersRef.current.get(data.socketId);
      if (pc) { pc.close(); peersRef.current.delete(data.socketId); }
      onRemoteParticipantRemove(data.socketId);
    };

    socket.on(SocketEvent.CALL_PARTICIPANT_JOINED, onParticipantJoined);
    socket.on(SocketEvent.CALL_P2P_OFFER, onOffer);
    socket.on(SocketEvent.CALL_P2P_ANSWER, onAnswer);
    socket.on(SocketEvent.CALL_P2P_ICE, onIce);
    socket.on(SocketEvent.CALL_PARTICIPANT_LEFT, onParticipantLeft);

    return () => {
      socket.off(SocketEvent.CALL_PARTICIPANT_JOINED, onParticipantJoined);
      socket.off(SocketEvent.CALL_P2P_OFFER, onOffer);
      socket.off(SocketEvent.CALL_P2P_ANSWER, onAnswer);
      socket.off(SocketEvent.CALL_P2P_ICE, onIce);
      socket.off(SocketEvent.CALL_PARTICIPANT_LEFT, onParticipantLeft);
    };
  }, [socket, enabled, roomId, createPeerConnection, onRemoteParticipantRemove]);

  useEffect(() => { if (!enabled && isInCallRef.current) leaveCall(); }, [enabled, leaveCall]);
  useEffect(() => () => { if (isInCallRef.current) leaveCall(); }, []);

  return { joinCall, leaveCall, toggleMic, toggleCamera };
}
