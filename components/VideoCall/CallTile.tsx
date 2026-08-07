"use client";

import { useCallback, useRef, useState } from "react";
import {
  LuMicOff, LuVideoOff, LuVolumeX,
} from "react-icons/lu";
import Avatar from "@/components/UI/Avatar";

interface CallTileProps {
  stream: MediaStream | null;
  username: string;
  isMuted?: boolean;
  isCameraOff?: boolean;
  isLocal?: boolean;
  isInCall?: boolean;
  size?: "sm" | "md";
  avatarUrl?: string;
  fill?: boolean;
}

export default function CallTile({
  stream, username,
  isMuted = false, isCameraOff = false,
  isLocal = false, isInCall = false,
  size = "md",
  avatarUrl,
  fill = false,
}: CallTileProps) {
  const initials = username
    .split(" ")
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";

  const hasVideoTrack = !!stream?.getVideoTracks().length;
  const showVideo = !!stream && hasVideoTrack && !isCameraOff;
  const avatarSize = size === "sm" ? "h-12 w-12 text-sm" : "h-14 w-14 text-base";
  const avatarPixels = size === "sm" ? 48 : 56;

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
      relative flex ${fill ? "h-full min-h-[72px]" : "aspect-video"} w-full items-center justify-center overflow-hidden rounded-lg
      transition-all duration-300
      ${isInCall ? "bg-zinc-950/75" : "bg-zinc-900/30"}
    `}>
      {/*
        Mounted whenever there is a stream, not only when there is a picture to show.

        This element is what actually plays the media, so unmounting it with the camera off
        silenced the participant as well — an audio-only call had nothing anywhere to come out
        of. When there is no video we keep it mounted and merely invisible, letting the avatar
        below cover it, so the audio keeps playing.
      */}
      {stream && (
        <video
          ref={setVideoEl}
          autoPlay
          playsInline
          muted={isLocal}
          className={`absolute inset-0 h-full w-full object-cover ${isLocal ? "scale-x-[-1]" : ""} ${showVideo ? "" : "opacity-0"}`}
        />
      )}

      <div className={`absolute inset-0 ${showVideo ? "bg-gradient-to-t from-black/60 via-transparent to-transparent" : "bg-white/[0.02]"}`} />

      {!showVideo && (
        <div className={`absolute inset-0 flex flex-col items-center justify-center gap-2 transition-opacity duration-300 ${isInCall ? "opacity-100" : "opacity-30"}`}>
          <div
            className={`${avatarSize} overflow-hidden rounded-full flex items-center justify-center text-white font-semibold
              ${isInCall
                ? "bg-gradient-to-br from-emerald-500/80 to-cyan-600/80 shadow-lg"
                : "bg-zinc-700"}
            `}
          >
            {avatarUrl ? (
              <Avatar
                url={avatarUrl}
                alt={username}
                size={avatarPixels}
              />
            ) : (
              initials
            )}
          </div>
          <div className="max-w-[80%] truncate text-center text-[11px] font-semibold leading-tight text-white/90">
            {username}{isLocal ? " (you)" : ""}
          </div>
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

      {showVideo && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex min-w-0 items-end px-2.5 py-2">
          <div className="min-w-0">
            <div className="max-w-[220px] truncate text-[11px] font-semibold leading-tight text-white/95 drop-shadow">
              {username}{isLocal ? " (you)" : ""}
            </div>
          </div>
        </div>
      )}

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
