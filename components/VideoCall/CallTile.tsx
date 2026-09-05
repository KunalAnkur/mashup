"use client";

import { useCallback, useRef, useState } from "react";
import { LuMicOff, LuVideoOff, LuVolumeX } from "react-icons/lu";
import Avatar from "@/components/UI/Avatar";
import { useTranslations } from "@/i18n/I18nProvider";

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
  /** Fill the parent's height on mobile, revert to a 16:9 box at md+. */
  responsiveFill?: boolean;
}

// A small, fixed set of soft two-stop gradients — picked per name so a person keeps the same
// colour across tiles, instead of the random ui-avatars fills that never matched anything.
const AVATAR_GRADIENTS = [
  "from-rose-500 to-pink-600",
  "from-sky-500 to-indigo-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-violet-500 to-fuchsia-600",
  "from-cyan-500 to-blue-600",
] as const;

function gradientFor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
}

export default function CallTile({
  stream,
  username,
  isMuted = false,
  isCameraOff = false,
  isLocal = false,
  isInCall = false,
  size = "md",
  avatarUrl,
  fill = false,
  responsiveFill = false,
}: CallTileProps) {
  const t = useTranslations("room.call");
  const label = isLocal ? t("selfLabel", { name: username }) : username;
  const initials =
    username
      .split(/\s+/)
      .map((w) => w[0] ?? "")
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?";

  const hasVideoTrack = !!stream?.getVideoTracks().length;
  const showVideo = !!stream && hasVideoTrack && !isCameraOff;
  const avatarSize = size === "sm" ? "h-11 w-11 text-[13px]" : "h-14 w-14 text-base";
  const avatarPixels = size === "sm" ? 44 : 56;

  // ─── Autoplay handling ────────────────────────────────────────────────────
  // Joining the call IS a user gesture so play() normally succeeds. This
  // fallback covers edge cases (e.g. page reload with an active call).
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);

  const setVideoEl = useCallback(
    (el: HTMLVideoElement | null) => {
      videoRef.current = el;
      if (!el) return;
      if (el.srcObject !== stream) el.srcObject = stream ?? null;
      if (stream) {
        el.play()
          .then(() => setAutoplayBlocked(false))
          .catch(() => setAutoplayBlocked(true));
      }
    },
    [stream]
  );

  const handleEnableAudio = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    el.muted = false;
    el.play()
      .then(() => setAutoplayBlocked(false))
      .catch(() => {});
  }, []);

  // ─── Visual styles ────────────────────────────────────────────────────────

  const shapeClass = fill
    ? "h-full min-h-[72px]"
    : responsiveFill
      ? "h-full min-h-[72px] md:aspect-video md:h-auto md:min-h-0"
      : "aspect-video";

  return (
    <div
      className={`group/tile relative flex ${shapeClass} w-full items-center justify-center overflow-hidden rounded-xl bg-zinc-900 shadow-[0_2px_10px_rgba(0,0,0,0.28)] transition-all duration-300 ${
        isLocal ? "ring-1 ring-emerald-400/30" : "ring-1 ring-white/[0.07]"
      } ${!showVideo && !isInCall ? "opacity-45" : ""}`}
    >
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
          className={`absolute inset-0 h-full w-full object-cover ${
            isLocal ? "scale-x-[-1]" : ""
          } ${showVideo ? "" : "opacity-0"}`}
        />
      )}

      {/* No-picture ground: a soft top-lit wash so the avatar sits on something with depth. */}
      {!showVideo && (
        <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_-10%,rgba(255,255,255,0.06),transparent_60%),linear-gradient(180deg,rgba(255,255,255,0.015),rgba(0,0,0,0.15))]" />
      )}

      {/* Scrim under the caption when a picture is showing. */}
      {showVideo && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
      )}

      {!showVideo && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-2">
          <div
            className={`${avatarSize} flex items-center justify-center overflow-hidden rounded-full font-semibold text-white shadow-lg ring-2 ring-white/10 ${
              avatarUrl ? "" : `bg-gradient-to-br ${gradientFor(username)}`
            }`}
          >
            {avatarUrl ? (
              <Avatar url={avatarUrl} alt={username} size={avatarPixels} />
            ) : (
              initials
            )}
          </div>

          <div className="flex max-w-full items-center gap-1.5">
            <span className="truncate text-[11px] font-semibold leading-tight text-white/85">
              {label}
            </span>
            {isInCall && isMuted && (
              <LuMicOff size={11} className="shrink-0 text-red-400/90" />
            )}
            {isInCall && isCameraOff && (
              <LuVideoOff size={11} className="shrink-0 text-white/40" />
            )}
          </div>
        </div>
      )}

      {/* Tap-to-play — shown only when the browser blocks autoplay for a remote tile */}
      {autoplayBlocked && !isLocal && (
        <button
          onClick={handleEnableAudio}
          className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-1.5 bg-black/55 backdrop-blur-sm"
          aria-label={t("tapToEnableAudio")}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/12 ring-1 ring-white/15">
            <LuVolumeX size={15} className="text-white/80" />
          </span>
          <span className="text-[10px] font-medium text-white/70">{t("tapToEnableAudio")}</span>
        </button>
      )}

      {/* Caption pill over a live picture. */}
      {showVideo && (
        <div className="pointer-events-none absolute inset-x-1.5 bottom-1.5 z-10 flex">
          <span className="inline-flex max-w-full items-center gap-1 rounded-md bg-black/45 px-1.5 py-[3px] text-[10px] font-medium leading-none text-white/95 backdrop-blur-sm">
            {isMuted && (
              <LuMicOff size={9} className="shrink-0 text-red-400" />
            )}
            <span className="truncate">{label}</span>
          </span>
        </div>
      )}
    </div>
  );
}
