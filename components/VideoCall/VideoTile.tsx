"use client";

import { useEffect, useRef } from "react";

interface VideoTileProps {
  stream: MediaStream | null;
  username: string;
  muted?: boolean;
  isCameraOn?: boolean;
  isLocal?: boolean;
}

export default function VideoTile({ stream, username, muted = false, isCameraOn = true, isLocal = false }: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (stream) {
      el.srcObject = stream;
    } else {
      el.srcObject = null;
    }
  }, [stream]);

  const initials = username
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const showVideo = stream && isCameraOn;

  return (
    <div className="relative flex items-center justify-center rounded-xl overflow-hidden bg-[#1a1a2e] aspect-video">
      {showVideo ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={muted}
          className={`w-full h-full object-cover ${isLocal ? "scale-x-[-1]" : ""}`}
        />
      ) : (
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold text-lg">
            {initials}
          </div>
          <span className="text-white/60 text-xs">{username}</span>
        </div>
      )}

      {/* name label */}
      <div className="absolute bottom-2 left-2 text-xs text-white/80 bg-black/40 px-2 py-0.5 rounded-full truncate max-w-[80%]">
        {username}{isLocal && " (you)"}
      </div>
    </div>
  );
}
