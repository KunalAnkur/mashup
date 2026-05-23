"use client";

import type { ReactNode } from "react";
import { useCallStream } from "@/context/CallStreamContext";
import { useRoomContext } from "@/context/RoomContext";
import CallTiles from "../VideoCall/CallTiles";
import CallUpsellTeaser from "../VideoCall/CallUpsellTeaser";
import { LuLoader, LuMic, LuPhone, LuVideo } from "react-icons/lu";

function Badge({
  icon,
  label,
}: {
  icon: ReactNode;
  label: string;
}) {
  return (
    <div className="inline-flex items-center gap-1 rounded-full bg-white/[0.05] px-2 py-1 text-[10px] font-semibold text-white/80 ring-1 ring-white/10">
      <span className="text-white/60">{icon}</span>
      <span className="leading-none truncate">{label}</span>
    </div>
  );
}

export default function PanelCallSection() {
  const {
    isJoining,
    isInCall,
    hostIsPremium,
    remoteParticipants,
    joinCall,
  } =
    useCallStream();
  const { participants } = useRoomContext();

  const hasActiveRemoteCall = remoteParticipants.size > 0;
  const activeCallCount = remoteParticipants.size + (isInCall ? 1 : 0);
  const handleStartAudio = () => {
    void joinCall({ micOn: true, cameraOn: false });
  };
  const handleStartVideo = () => {
    void joinCall({ micOn: true, cameraOn: true });
  };
  const startButtons = (
    <div className="flex shrink-0 items-center gap-1.5">
      <button
        type="button"
        onClick={handleStartAudio}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.08] text-white/78 ring-1 ring-white/10 transition-colors hover:bg-white/[0.14] hover:text-white"
        aria-label="Start audio call"
        title="Start audio call"
      >
        <LuPhone size={16} />
      </button>
      <button
        type="button"
        onClick={handleStartVideo}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-950/30 transition-colors hover:bg-emerald-400"
        aria-label="Start video call"
        title="Start video call"
      >
        <LuVideo size={16} />
      </button>
    </div>
  );

  if (!hostIsPremium) {
    return (
      <section className="shrink-0 px-2 pb-3">
        <CallUpsellTeaser />
      </section>
    );
  }

  return (
    <section className="shrink-0 px-2 pb-3">
      {!isInCall && !isJoining ? (
        hasActiveRemoteCall ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2 px-1">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold leading-tight text-white/85">
                  Live now
                </p>
                <p className="mt-0.5 truncate text-[10px] leading-tight text-white/45">
                  {remoteParticipants.size} sharing in this room
                </p>
              </div>
              {startButtons}
            </div>
            <CallTiles compact showControls={false} />
          </div>
        ) : (
          <div className="rounded-2xl bg-white/[0.035] p-2.5 ring-1 ring-white/[0.08]">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold leading-tight text-white/85">
                  Start a call
                </p>
                <p className="mt-0.5 truncate text-[10px] leading-tight text-white/45">
                  {participants.length} people in this room
                </p>
              </div>
              {startButtons}
            </div>
          </div>
        )
      ) : isJoining ? (
        <div className="space-y-2">
          {hasActiveRemoteCall && <CallTiles compact showControls={false} />}
          <div className="flex items-center gap-2 rounded-2xl bg-white/[0.035] px-3 py-3 ring-1 ring-white/[0.08]">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.08]">
              <LuLoader className="animate-spin text-white/70" size={15} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold leading-tight text-white/85">
                Starting your feed
              </p>
              <p className="mt-0.5 truncate text-[10px] leading-tight text-white/45">
                Others will see you once your camera and mic are ready
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div>
          <div className="mb-2 flex items-center justify-between gap-2 px-1">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold leading-tight text-white/85">
                Live call
              </p>
              <p className="mt-0.5 truncate text-[10px] leading-tight text-white/45">
                {activeCallCount} in call
              </p>
            </div>
            {remoteParticipants.size === 0 && (
              <Badge icon={<LuMic size={12} />} label="Waiting" />
            )}
          </div>
          <CallTiles compact />
        </div>
      )}
    </section>
  );
}
