"use client";

import {
  createContext, useContext, useState, useCallback,
  useRef, useEffect, ReactNode,
} from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import { SubscriptionTier } from "@/types/subscriptionTypes";
import { useRoomContext } from "@/context/RoomContext";
import { useSocket } from "@/context/SocketContext";
import { SocketEvent } from "@/types/socketEvents";
import { useCallSFU } from "@/hooks/useCallSFU";
import { useCallP2P } from "@/hooks/useCallP2P";

// ─── Public types ─────────────────────────────────────────────────────────────

export interface CallParticipant {
  socketId: string;
  username: string;
  profile?: string;
  stream?: MediaStream;
  isMicOn: boolean;
  isCameraOn: boolean;
}

export interface CallStreamActions {
  joinCall: (opts?: { micOn?: boolean; cameraOn?: boolean }) => Promise<void>;
  leaveCall: () => void;
  toggleMic: () => void;
  toggleCamera: () => void;
}

export interface CallStreamContextType extends CallStreamActions {
  isInCall: boolean;
  isJoining: boolean;
  callMode: "sfu" | "p2p" | null;
  isPremium: boolean;
  hostIsPremium: boolean;
  isHost: boolean;
  isMicOn: boolean;
  isCameraOn: boolean;
  localStream: MediaStream | null;
  remoteParticipants: Map<string, CallParticipant>;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const CallStreamContext = createContext<CallStreamContextType | null>(null);

// ─── Provider ────────────────────────────────────────────────────────────────

export function CallStreamProvider({ children }: { children: ReactNode }) {
  const { isJoined, hostIsPremium, isHost, roomId: ctxRoomId } = useRoomContext();
  const { socket } = useSocket();
  const roomState = useSelector((state: RootState) => state.room);
  const roomId = roomState.roomId ?? null;
  const subscriptionTier = useSelector(
    (state: RootState) => state.subscription.subscription?.tier
  );
  const isPremium = subscriptionTier === SubscriptionTier.PREMIUM;

  // ─── Shared state ──────────────────────────────────────────────────────────
  const [isInCall, setIsInCall] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [callMode, setCallMode] = useState<"sfu" | "p2p" | null>(null);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteParticipants, setRemoteParticipants] = useState<Map<string, CallParticipant>>(new Map());

  // Refs so toggle callbacks always read current values without stale closures
  const isMicOnRef = useRef(true);
  const isCameraOnRef = useRef(true);
  const localStreamRef = useRef<MediaStream | null>(null);

  // ─── Shared callbacks ─────────────────────────────────────────────────────

  const handleLocalStream = useCallback((stream: MediaStream | null) => {
    localStreamRef.current = stream;
    setLocalStream(stream);
  }, []);

  const handleRemoteParticipantUpdate = useCallback(
    (socketId: string, updater: (prev: CallParticipant | undefined) => Partial<CallParticipant>) => {
      setRemoteParticipants((prev) => {
        const next = new Map(prev);
        const existing = next.get(socketId);
        const base: CallParticipant = {
          socketId,
          username: existing?.username ?? socketId,
          isMicOn: existing?.isMicOn ?? true,
          isCameraOn: existing?.isCameraOn ?? true,
          stream: existing?.stream,
        };
        next.set(socketId, { ...base, ...updater(existing) });
        return next;
      });
    },
    []
  );

  const handleRemoteParticipantRemove = useCallback((socketId: string) => {
    setRemoteParticipants((prev) => {
      const next = new Map(prev);
      next.delete(socketId);
      return next;
    });
  }, []);

  const handleCallJoined = useCallback(() => {
    setIsInCall(true);
    setIsJoining(false);
  }, []);

  const handleCallLeft = useCallback(() => {
    setIsInCall(false);
    setCallMode(null);
    isMicOnRef.current = true;
    isCameraOnRef.current = true;
    setIsMicOn(true);
    setIsCameraOn(true);
    setRemoteParticipants(new Map());
  }, []);

  // ─── Listen for participant join / leave / media-state from others ─────────

  useEffect(() => {
    if (!socket || !roomId || !isJoined) return;

    const onParticipantJoined = (data: { socketId: string; username: string; profile?: string; isMicOn?: boolean; isCameraOn?: boolean }) => {
      setRemoteParticipants((prev) => {
        const next = new Map(prev);
        const existing = next.get(data.socketId);
        next.set(data.socketId, {
          socketId: data.socketId,
          username: data.username,
          profile: data.profile,
          // Trust server-broadcast state if present (so initial off-state shows right away)
          isMicOn: data.isMicOn ?? existing?.isMicOn ?? true,
          isCameraOn: data.isCameraOn ?? existing?.isCameraOn ?? true,
          stream: existing?.stream,
        });
        return next;
      });
    };

    const onParticipantLeft = (data: { socketId: string }) => {
      setRemoteParticipants((prev) => {
        const next = new Map(prev);
        next.delete(data.socketId);
        return next;
      });
    };

    const onMediaState = (data: { socketId: string; isMicOn: boolean; isCameraOn: boolean }) => {
      setRemoteParticipants((prev) => {
        const existing = prev.get(data.socketId);
        if (!existing) return prev;
        const next = new Map(prev);
        next.set(data.socketId, { ...existing, isMicOn: data.isMicOn, isCameraOn: data.isCameraOn });
        return next;
      });
    };

    socket.on(SocketEvent.CALL_PARTICIPANT_JOINED, onParticipantJoined);
    socket.on(SocketEvent.CALL_PARTICIPANT_LEFT, onParticipantLeft);
    socket.on(SocketEvent.CALL_MEDIA_STATE, onMediaState);

    return () => {
      socket.off(SocketEvent.CALL_PARTICIPANT_JOINED, onParticipantJoined);
      socket.off(SocketEvent.CALL_PARTICIPANT_LEFT, onParticipantLeft);
      socket.off(SocketEvent.CALL_MEDIA_STATE, onMediaState);
    };
  }, [socket, roomId, isJoined]);

  // ─── Both hooks always mounted — gated by enabled prop ────────────────────

  const sfuActions = useCallSFU({
    roomId,
    enabled: isJoined && hostIsPremium,
    onLocalStream: handleLocalStream,
    onRemoteParticipantUpdate: handleRemoteParticipantUpdate,
    onRemoteParticipantRemove: handleRemoteParticipantRemove,
    onCallJoined: handleCallJoined,
    onCallLeft: handleCallLeft,
    localStreamRef,
  });

  const p2pActions = useCallP2P({
    roomId,
    enabled: false, // P2P retired — host-premium SFU for all
    onLocalStream: handleLocalStream,
    onRemoteParticipantUpdate: handleRemoteParticipantUpdate,
    onRemoteParticipantRemove: handleRemoteParticipantRemove,
    onCallJoined: handleCallJoined,
    onCallLeft: handleCallLeft,
    localStreamRef,
  });

  // ─── Unified actions ──────────────────────────────────────────────────────

  const joinCall = useCallback(async (opts?: { micOn?: boolean; cameraOn?: boolean }) => {
    if (isInCall || isJoining) return;
    const wantMic = opts?.micOn !== false;
    const wantCam = opts?.cameraOn !== false;
    // Pre-set local state so the UI reflects the requested initial mode instantly
    isMicOnRef.current = wantMic;
    isCameraOnRef.current = wantCam;
    setIsMicOn(wantMic);
    setIsCameraOn(wantCam);
    setIsJoining(true);
    setCallMode("sfu");
    await sfuActions.joinCall({ micOn: wantMic, cameraOn: wantCam });
  }, [isInCall, isJoining, sfuActions]);

  const leaveCall = useCallback(() => {
    sfuActions.leaveCall();
  }, [sfuActions]);

  // Fix: context owns the track toggle + broadcasts; hooks do NOT touch tracks.
  const toggleMic = useCallback(() => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    isMicOnRef.current = track.enabled;
    setIsMicOn(track.enabled);
    if (socket && roomId) {
      socket.emit(SocketEvent.CALL_MEDIA_STATE, {
        roomId,
        isMicOn: isMicOnRef.current,
        isCameraOn: isCameraOnRef.current,
      });
    }
  }, [socket, roomId]);

  const toggleCamera = useCallback(() => {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    isCameraOnRef.current = track.enabled;
    setIsCameraOn(track.enabled);
    if (socket && roomId) {
      socket.emit(SocketEvent.CALL_MEDIA_STATE, {
        roomId,
        isMicOn: isMicOnRef.current,
        isCameraOn: isCameraOnRef.current,
      });
    }
  }, [socket, roomId]);

  return (
    <CallStreamContext.Provider value={{
      isInCall, isJoining, callMode, isPremium, hostIsPremium, isHost,
      isMicOn, isCameraOn, localStream, remoteParticipants,
      joinCall, leaveCall, toggleMic, toggleCamera,
    }}>
      {children}
    </CallStreamContext.Provider>
  );
}

// ─── Consumer hook ───────────────────────────────────────────────────────────

export function useCallStream(): CallStreamContextType {
  const ctx = useContext(CallStreamContext);
  if (!ctx) throw new Error("useCallStream must be used inside CallStreamProvider");
  return ctx;
}
