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
import { useAudioVideoCall } from "@/hooks/useAudioVideoCall";

// ─── Public types ─────────────────────────────────────────────────────────────

export type { CallParticipant } from "@/hooks/useAudioVideoCall";
import type { CallParticipant } from "@/hooks/useAudioVideoCall";

export interface CallStreamContextType {
  isInCall: boolean;
  isJoining: boolean;
  isPremium: boolean;
  hostIsPremium: boolean;
  isHost: boolean;
  isMicOn: boolean;
  isCameraOn: boolean;
  localStream: MediaStream | null;
  remoteParticipants: Map<string, CallParticipant>;
  joinCall: (opts?: { micOn?: boolean; cameraOn?: boolean }) => Promise<void>;
  leaveCall: () => void;
  toggleMic: () => void;
  toggleCamera: () => void;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const CallStreamContext = createContext<CallStreamContextType | null>(null);

// ─── Provider ────────────────────────────────────────────────────────────────

export function CallStreamProvider({ children }: { children: ReactNode }) {
  const { isJoined, hostIsPremium, isHost } = useRoomContext();
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
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteParticipants, setRemoteParticipants] = useState<Map<string, CallParticipant>>(new Map());

  // Refs so toggle callbacks read current values without stale closures
  const isMicOnRef = useRef(true);
  const isCameraOnRef = useRef(true);
  const localStreamRef = useRef<MediaStream | null>(null);

  // ─── Shared callbacks passed into the hook ────────────────────────────────

  const handleLocalStream = useCallback((stream: MediaStream | null) => {
    localStreamRef.current = stream;
    setLocalStream(stream);
  }, []);

  const handleParticipantUpdate = useCallback(
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

  const handleParticipantRemove = useCallback((socketId: string) => {
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

  const handleCallLeft = useCallback((opts?: { keepRemoteParticipants?: boolean }) => {
    setIsInCall(false);
    isMicOnRef.current = true;
    isCameraOnRef.current = true;
    setIsMicOn(true);
    setIsCameraOn(true);
    if (!opts?.keepRemoteParticipants) {
      setRemoteParticipants(new Map());
    }
  }, []);

  // ─── Socket: participant join / leave / media-state ────────────────────────

  useEffect(() => {
    if (!socket || !roomId || !isJoined) return;

    const onParticipantJoined = (data: {
      socketId: string;
      username: string;
      profile?: string;
      isMicOn?: boolean;
      isCameraOn?: boolean;
    }) => {
      setRemoteParticipants((prev) => {
        const next = new Map(prev);
        const existing = next.get(data.socketId);
        next.set(data.socketId, {
          socketId: data.socketId,
          username: data.username,
          profile: data.profile,
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

  // ─── useAudioVideoCall — the single SFU hook ──────────────────────────────

  const callActions = useAudioVideoCall({
    roomId,
    enabled: isJoined && hostIsPremium,
    localStreamRef,
    onLocalStream: handleLocalStream,
    onParticipantUpdate: handleParticipantUpdate,
    onParticipantRemove: handleParticipantRemove,
    onJoined: handleCallJoined,
    onLeft: handleCallLeft,
  });

  // ─── Unified actions ──────────────────────────────────────────────────────

  const joinCall = useCallback(async (opts?: { micOn?: boolean; cameraOn?: boolean }) => {
    if (isInCall || isJoining) return;
    const wantMic = opts?.micOn !== false;
    const wantCam = opts?.cameraOn !== false;
    isMicOnRef.current = wantMic;
    isCameraOnRef.current = wantCam;
    setIsMicOn(wantMic);
    setIsCameraOn(wantCam);
    setIsJoining(true);
    try {
      await callActions.joinCall({ micOn: wantMic, cameraOn: wantCam });
    } finally {
      setIsJoining(false);
    }
  }, [isInCall, isJoining, callActions]);

  const leaveCall = useCallback(() => {
    callActions.leaveCall();
  }, [callActions]);

  // Context owns track state + broadcasts; hook only flips the underlying track
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
      isInCall, isJoining, isPremium, hostIsPremium, isHost,
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
