"use client";

import { useCallback, useRef, useState } from "react";
import {
  LuMicOff, LuVideoOff, LuVolumeX,
} from "react-icons/lu";

interface CallTileProps {
  stream: MediaStream | null;
  username: string;
  isMuted?: boolean;
  isCameraOff?: boolean;
  isLocal?: boolean;
  isInCall?: boolean;
  size?: "sm" | "md";
}

export default function CallTile({
  stream, username,
  isMuted = false, isCameraOff = false,
  isLocal = false, isInCall = false,
  size = "md",
}: CallTileProps) {
  const initials = username
    .split(" ")
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";

  const hasVideoTrack = !!stream?.getVideoTracks().length;
  const showVideo = !!stream && hasVideoTrack && !isCameraOff;
  const avatarSize = size === "sm" ? "w-7 h-7 text-[10px]" : "w-10 h-10 text-sm";

  // ─── Autoplay handling ────────────────────────────────────────────────────
  // Joining the call IS a user gesture so play() normally succeeds. This
  // fallback covers edge cases (e.g. page reload with an active call).
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);

  const setVideoEl = useCallback((el: HTMLVideoElement | null) => {
    videoRef.current = el;
    if (!el) return;
    if (el.srcObject !== stream) el.srcObject = stream ?? null;
    if (stream) {
      el.play()
        .then(() => setAutoplayBlocked(false))
        .catch(() => setAutoplayBlocked(true));
    }
  }, [stream]);

  const handleEnableAudio = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    el.muted = false;
    el.play()
      .then(() => setAutoplayBlocked(false))
      .catch(() => {});
  }, []);

  // ─── Visual styles ────────────────────────────────────────────────────────

  return (
    <div className={`
      relative flex items-center justify-center rounded-xl overflow-hidden aspect-video w-full
      ring-1 transition-all duration-300
      ${isInCall ? "bg-zinc-950/75 ring-white/[0.10]" : "bg-zinc-900/30 ring-white/[0.04]"}
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
                ? "bg-gradient-to-br from-emerald-500/80 to-cyan-600/80 shadow-lg"
                : "bg-zinc-700"}
            `}
          >
            {initials}
          </div>
          {isInCall && (
            <span className="text-[9px] font-medium text-white/45">
              Audio
            </span>
          )}
        </div>
      )}

      {/* Tap-to-play — shown only when browser blocks autoplay for a remote tile */}
      {autoplayBlocked && !isLocal && (
        <button
          onClick={handleEnableAudio}
          className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-1.5 bg-black/50 backdrop-blur-sm"
          aria-label="Tap to enable audio"
        >
          <LuVolumeX size={16} className="text-white/70" />
          <span className="text-[10px] text-white/60">Tap to enable audio</span>
        </button>
      )}

      {/* Username — top-left */}
      <div className="absolute top-1.5 left-2 z-10 pointer-events-none">
        <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium truncate
          ${isInCall ? "text-white/90 bg-black/40 backdrop-blur-sm" : "text-white/30"}
        `}>
          {username}{isLocal ? " (you)" : ""}
        </span>
      </div>

      {/* Read-only state badges */}
      {isInCall && (isMuted || isCameraOff) && (
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
      )}
    </div>
  );
}
