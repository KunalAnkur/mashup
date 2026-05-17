"use client";

import { useCallback } from "react";
import {
  LuMic, LuMicOff, LuVideo, LuVideoOff, LuLoader,
} from "react-icons/lu";

interface CallTileProps {
  stream: MediaStream | null;
  username: string;
  isMuted?: boolean;
  isCameraOff?: boolean;
  isLocal?: boolean;
  isInCall?: boolean;
  size?: "sm" | "md";

  // Local-only actions
  isJoining?: boolean;
  onJoin?: (opts?: { micOn?: boolean; cameraOn?: boolean }) => void;
  onToggleMic?: () => void;
  onToggleCamera?: () => void;
}

export default function CallTile({
  stream, username,
  isMuted = false, isCameraOff = false,
  isLocal = false, isInCall = false,
  size = "md",
  isJoining = false,
  onJoin, onToggleMic, onToggleCamera,
}: CallTileProps) {
  const initials = username
    .split(" ")
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";

  const showVideo = !!stream && !isCameraOff;
  const avatarSize = size === "sm" ? "w-7 h-7 text-[10px]" : "w-10 h-10 text-sm";

  // Callback ref fires both on mount and when stream changes
  const setVideoEl = useCallback((el: HTMLVideoElement | null) => {
    if (!el) return;
    if (el.srcObject !== stream) el.srcObject = stream ?? null;
    if (stream) {
      const p = el.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    }
  }, [stream]);

  // ─── per-feature handlers (each button toggles only its own thing) ──────
  const handleMicClick = () => {
    if (isJoining) return;
    if (!isInCall) onJoin?.({ micOn: true, cameraOn: false });
    else onToggleMic?.();
  };
  const handleCamClick = () => {
    if (isJoining) return;
    if (!isInCall) onJoin?.({ micOn: false, cameraOn: true });
    else onToggleCamera?.();
  };
  // ─── visual styles ──────────────────────────────────────────────────────
  const btnBase = "w-7 h-7 rounded-full flex items-center justify-center transition-all duration-150 shrink-0 disabled:opacity-60";
  const neutralBtn = "bg-white/15 hover:bg-white/25 text-white";
  const offBtn = "bg-red-500/95 hover:bg-red-500 text-white";
  const dimBtn = "bg-white/10 hover:bg-white/20 text-white/70";

  return (
    <div className={`
      relative flex items-center justify-center rounded-2xl overflow-hidden aspect-video w-full
      ring-1 transition-all duration-300
      ${isInCall ? "bg-zinc-900/70 ring-white/[0.08]" : "bg-zinc-900/30 ring-white/[0.04]"}
    `}>
      {showVideo && (
        <video
          ref={setVideoEl}
          autoPlay
          playsInline
          muted={isLocal}
          className={`w-full h-full object-cover ${isLocal ? "scale-x-[-1]" : ""}`}
        />
      )}

      {!showVideo && (
        <div className={`flex flex-col items-center gap-1.5 transition-opacity duration-300 ${isInCall ? "opacity-100" : "opacity-30"}`}>
          <div
            className={`${avatarSize} rounded-full flex items-center justify-center text-white font-semibold
              ${isInCall
                ? "bg-gradient-to-br from-violet-500/80 to-indigo-600/80 shadow-lg"
                : "bg-zinc-700"}
            `}
          >
            {initials}
          </div>
          {size === "md" && !isInCall && (
            <span className="text-white/25 text-[9px]">Not in call</span>
          )}
        </div>
      )}

      {/* username — top-left */}
      <div className="absolute top-1.5 left-2 z-10 pointer-events-none">
        <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium truncate
          ${isInCall ? "text-white/90 bg-black/40 backdrop-blur-sm" : "text-white/30"}
        `}>
          {username}{isLocal ? " (you)" : ""}
        </span>
      </div>

      {/* Per-tile controls OVER the video */}
      {isLocal ? (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20
                        flex items-center gap-1.5 bg-black/50 backdrop-blur-md
                        rounded-full px-1.5 py-1 ring-1 ring-white/10 shadow-lg">
          {/* MIC button — toggles only mic */}
          <button
            onClick={handleMicClick}
            disabled={isJoining}
            title={!isInCall ? "Join with mic" : isMuted ? "Unmute" : "Mute"}
            className={`${btnBase} ${
              isInCall && isMuted ? offBtn :
              isInCall && !isMuted ? neutralBtn :
              dimBtn
            }`}
          >
            {isInCall && isMuted ? <LuMicOff size={12} /> : <LuMic size={12} />}
          </button>

          {/* CAMERA button — toggles only camera */}
          <button
            onClick={handleCamClick}
            disabled={isJoining}
            title={!isInCall ? "Join with camera" : isCameraOff ? "Turn on camera" : "Turn off camera"}
            className={`${btnBase} ${
              isInCall && isCameraOff ? offBtn :
              isInCall && !isCameraOff ? neutralBtn :
              dimBtn
            }`}
          >
            {isJoining ? <LuLoader size={12} className="animate-spin" />
              : isInCall && isCameraOff ? <LuVideoOff size={12} />
              : <LuVideo size={12} />}
          </button>
        </div>
      ) : (
        // Remote: read-only status indicators (only shown when something is off)
        isInCall && (isMuted || isCameraOff) && (
          <div className="absolute bottom-2 right-2 z-20 flex items-center gap-1">
            {isMuted && (
              <div className="w-5 h-5 rounded-full bg-red-500/95 flex items-center justify-center shadow ring-1 ring-black/20">
                <LuMicOff size={9} className="text-white" />
              </div>
            )}
            {isCameraOff && (
              <div className="w-5 h-5 rounded-full bg-red-500/95 flex items-center justify-center shadow ring-1 ring-black/20">
                <LuVideoOff size={9} className="text-white" />
              </div>
            )}
          </div>
        )
      )}
    </div>
  );
}
