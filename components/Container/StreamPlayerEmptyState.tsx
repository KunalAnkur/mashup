"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { RoomType } from "@/context/RoomContext";
import getPlayerMessage from "@/utils/playerState";
import { Playlist } from "@/types/storeTypes";
import { ContentSelection } from "@/components/Panel/PlaylistTab/ContentSelection";
import { usePlaylistActions } from "@/hooks/usePlaylistActions";

type StreamPlayerEmptyStateProps = {
    isHost: boolean;
    roomType: RoomType | null;
    hostLeft: boolean;
    playlist?: Playlist[];
    remoteStream: MediaStream | null;
    isInitialized: boolean;
};

const StreamPlayerEmptyState = ({
    isHost,
    roomType,
    hostLeft,
    remoteStream,
    isInitialized,
    playlist = [],
}: StreamPlayerEmptyStateProps) => {
    const [isLoading, setIsLoading] = useState(true);
    const [contentVisible, setContentVisible] = useState(false);
    const isHostWithoutPlaylist = isHost && playlist.length === 0;
    const { addPlaylistContent, handleScreenShareStopped } = usePlaylistActions();

    useEffect(() => {
        if (isHostWithoutPlaylist) {
            setIsLoading(false);
            setContentVisible(true);
            return;
        }

        if (hostLeft && !isHost) {
            setIsLoading(false);
            setContentVisible(true);
            return;
        }

        const loaderTimer = setTimeout(() => {
            setIsLoading(false);
        }, 2000);

        const contentTimer = setTimeout(() => {
            setContentVisible(true);
        }, 2300);

        return () => {
            clearTimeout(loaderTimer);
            clearTimeout(contentTimer);
        };
    }, [hostLeft, isHost, isHostWithoutPlaylist]);

    const message = isHost
        ? "Loading video..."
        : getPlayerMessage(isHost, roomType || "sync", hostLeft, remoteStream);

    // ─── Loader ─────────────────────────────────────────────────────────────────
    if (isLoading) {
        return (
            <div className="relative w-full h-full bg-[#0f0f11] flex items-center justify-center overflow-hidden">
                <Orbs />
                <div className="relative z-10 flex flex-col items-center gap-6">
                    {/* Spinning ring + icon */}
                    <div className="relative w-16 h-16 flex items-center justify-center">
                        <svg className="absolute inset-0 w-full h-full animate-[spin_1.8s_ease-in-out_forwards]" viewBox="0 0 64 64" fill="none">
                            <circle cx="32" cy="32" r="30" stroke="rgba(255,255,255,.06)" strokeWidth="1.5" />
                            <circle
                                cx="32" cy="32" r="30"
                                stroke="url(#loader-gradient)"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeDasharray="188"
                                strokeDashoffset="188"
                                style={{ animation: "loaderRing 1.8s ease forwards" }}
                            />
                            <defs>
                                <linearGradient id="loader-gradient" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
                                    <stop stopColor="#a855f7" />
                                    <stop offset="1" stopColor="#ec4899" />
                                </linearGradient>
                            </defs>
                        </svg>
                        <span className="text-2xl z-10">🎬</span>
                    </div>

                    {/* Progress bar */}
                    <div className="w-40 h-0.5 bg-white/5 rounded-full overflow-hidden">
                        <div
                            className="h-full rounded-full"
                            style={{
                                background: "linear-gradient(90deg,#a855f7,#ec4899,#a855f7)",
                                backgroundSize: "200%",
                                animation: "loaderBar 1.8s cubic-bezier(.4,0,.2,1) forwards, shimmer 1.5s ease-in-out infinite",
                            }}
                        />
                    </div>

                    <p className="text-[11px] text-white/30 tracking-widest font-medium uppercase">
                        Loading stream
                    </p>
                </div>

                <style>{`
                    @keyframes loaderRing {
                        0%   { stroke-dashoffset: 188; }
                        100% { stroke-dashoffset: 0; }
                    }
                    @keyframes loaderBar {
                        0%   { width: 0%; }
                        100% { width: 100%; }
                    }
                    @keyframes shimmer {
                        0%   { background-position: -200% center; }
                        100% { background-position: 200% center; }
                    }
                    @keyframes floatUp {
                        0%, 100% { transform: translateY(0px); }
                        50%       { transform: translateY(-10px); }
                    }
                    @keyframes waveHand {
                        0%, 100% { transform: rotate(0deg); }
                        20%       { transform: rotate(-20deg); }
                        40%       { transform: rotate(16deg); }
                        60%       { transform: rotate(-10deg); }
                        80%       { transform: rotate(8deg); }
                    }
                    @keyframes pulseRing {
                        0%, 100% { opacity: .5; transform: scale(1); }
                        50%       { opacity: 1; transform: scale(1.04); }
                    }
                    @keyframes barDot {
                        0%, 80%, 100% { transform: scaleY(.4); }
                        40%            { transform: scaleY(1); }
                    }
                    @keyframes fadeSlideUp {
                        from { opacity: 0; transform: translateY(14px); }
                        to   { opacity: 1; transform: translateY(0); }
                    }
                    @keyframes orbDrift1 {
                        0%, 100% { transform: translate(0, 0) scale(1); }
                        50%       { transform: translate(20px, -30px) scale(1.08); }
                    }
                    @keyframes orbDrift2 {
                        0%, 100% { transform: translate(0, 0) scale(1); }
                        50%       { transform: translate(-25px, 20px) scale(1.05); }
                    }
                    @keyframes orbDrift3 {
                        0%, 100% { transform: translate(0, 0) scale(1.05); }
                        50%       { transform: translate(15px, 25px) scale(1); }
                    }
                `}</style>
            </div>
        );
    }

    // ─── Host Left ──────────────────────────────────────────────────────────────
    if (hostLeft && !isHost) {
        return (
            <div className="relative w-full h-full bg-[#0f0f11] flex items-center justify-center overflow-hidden">
                <Orbs />
                <AnimStyles />
                {/* <FloatingEmojis /> */}

                <div
                    className="relative z-20 flex flex-col items-center text-center px-6 max-w-sm"
                    style={{ animation: contentVisible ? "fadeSlideUp .5s ease both" : "none", opacity: contentVisible ? 1 : 0 }}
                >
                    {/* Waving hand */}
                    <div className="relative flex items-center justify-center mb-7">
                        <div className="absolute w-20 h-20 rounded-full border border-purple-500/25" style={{ animation: "pulseRing 2s ease-in-out infinite" }} />
                        <div className="absolute w-28 h-28 rounded-full border border-pink-500/12" style={{ animation: "pulseRing 2s ease-in-out infinite", animationDelay: ".6s" }} />
                        <span className="text-4xl" style={{ animation: "waveHand 2.5s ease-in-out infinite" }}>👋</span>
                    </div>

                    {/* Session ended pill */}
                    <div className="mb-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                        <span className="text-[10px] text-white/40 font-medium tracking-widest uppercase">Session ended</span>
                    </div>

                    <h2 className="text-2xl font-bold mb-1.5 leading-snug tracking-tight">
                        <span className="text-white/90">That was </span>
                        <span style={{ background: "linear-gradient(135deg,#e9d5ff,#f9a8d4,#c4b5fd)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                            amazing
                        </span>
                        <span className="text-white/90"> 🎉</span>
                    </h2>

                    <p className="text-sm text-white/50 mb-5 leading-relaxed">
                        {message || "The host has left the room."}
                    </p>

                    <p className="text-[13px] text-white/35 mb-4">
                        Want to watch something else with friends?
                    </p>

                    <Link
                        href="/"
                        className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
                        style={{ background: "linear-gradient(135deg,#7c3aed,#db2777)" }}
                    >
                        Create another room
                        <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                    </Link>
                </div>
            </div>
        );
    }

    // ─── Default (Host preparing / Viewer waiting) ───────────────────────────────
    return (
        <div className="relative w-full h-full bg-[#0f0f11] flex items-center justify-center overflow-hidden">
            <Orbs />
            <AnimStyles />
            {/* <FloatingEmojis /> */}

            <div
                className="relative z-20 flex flex-col items-center text-center px-6 max-w-sm"
                style={{ animation: contentVisible ? "fadeSlideUp .5s ease both" : "none", opacity: contentVisible ? 1 : 0 }}
            >
                {/* Icon */}
                <div className="relative flex items-center justify-center mb-7">
                    <div className="absolute w-20 h-20 rounded-full border border-purple-500/25" style={{ animation: "pulseRing 2s ease-in-out infinite" }} />
                    <div className="absolute w-28 h-28 rounded-full border border-pink-500/12" style={{ animation: "pulseRing 2s ease-in-out infinite", animationDelay: ".6s" }} />
                    <span className="text-4xl" style={{ animation: "floatUp 3s ease-in-out infinite" }}>
                        {isHost ? "🎬" : "⏳"}
                    </span>
                </div>

                {/* Headline */}
                <h2 className="text-2xl font-bold mb-2 leading-snug tracking-tight">
                    {isHost ? (
                        <>
                            {isHostWithoutPlaylist ? (
                                <>
                                    <span className="text-white/90">No content in playlist </span>
                                    <span style={{ background: "linear-gradient(135deg,#e9d5ff,#f9a8d4,#c4b5fd)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>yet</span>
                                </>
                            ) : (
                                <>
                                    <span className="text-white/90">Setting up your </span>
                                    <span style={{ background: "linear-gradient(135deg,#e9d5ff,#f9a8d4,#c4b5fd)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>stream</span>
                                </>
                            )}
                        </>
                    ) : (
                        <>
                            <span className="text-white/90">Waiting for the </span>
                            <span style={{ background: "linear-gradient(135deg,#e9d5ff,#f9a8d4,#c4b5fd)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>host</span>
                        </>
                    )}
                </h2>

                <p className="text-sm text-white/40 mb-5 leading-relaxed">
                    {isHost
                        ? isHostWithoutPlaylist
                            ? "Add URL, files, or start screen share to begin streaming."
                            : "Your stream is being prepared.\nViewers are waiting for you."
                        : `The host hasn't started yet. You'll be connected automatically.${isInitialized ? " (Ready)" : ""}`
                    }
                </p>

                {/* Equalizer dots */}
                {!isHostWithoutPlaylist && (
                    <div className="flex gap-1 items-center mb-5">
                        {[0, 0.2, 0.4].map((delay, i) => (
                            <div
                                key={i}
                                className="w-[3px] h-4 rounded-sm"
                                style={{
                                    background: ["#a855f7", "#ec4899", "#818cf8"][i],
                                    animation: `barDot 1.2s ease-in-out infinite`,
                                    animationDelay: `${delay}s`,
                                }}
                            />
                        ))}
                    </div>
                )}

                {/* Status badge */}
                {isHost && !isHostWithoutPlaylist && (
                    <StatusBadge variant="purple" label="Preparing your stream" />
                )}
                {isInitialized && !isHost && (
                    <StatusBadge variant="green" label="Ready to receive stream" />
                )}

                {isHostWithoutPlaylist && (
                    <div className="w-full mt-1">
                        <ContentSelection
                            onAddContent={addPlaylistContent}
                            onScreenShareStopped={handleScreenShareStopped}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

// ─── Sub-components ────────────────────────────────────────────────────────────

const Orbs = () => (
    <div className="absolute inset-0 pointer-events-none">
        <div className="absolute w-64 h-64 rounded-full -top-16 -left-10"
            style={{ background: "rgba(168,85,247,.22)", filter: "blur(60px)", animation: "orbDrift1 7s ease-in-out infinite" }} />
        <div className="absolute w-60 h-60 rounded-full -bottom-12 -right-10"
            style={{ background: "rgba(236,72,153,.18)", filter: "blur(60px)", animation: "orbDrift2 8s ease-in-out infinite" }} />
        <div className="absolute w-48 h-48 rounded-full bottom-8"
            style={{ left: "30%", background: "rgba(99,102,241,.15)", filter: "blur(60px)", animation: "orbDrift3 6s ease-in-out infinite" }} />
    </div>
);

const StatusBadge = ({ variant, label }: { variant: "purple" | "green"; label: string }) => {
    const colors = {
        purple: { bg: "rgba(168,85,247,.1)", border: "rgba(168,85,247,.3)", text: "rgba(216,180,254,.9)", dot: "#a855f7" },
        green: { bg: "rgba(52,211,153,.08)", border: "rgba(52,211,153,.25)", text: "rgba(110,231,183,.9)", dot: "#34d399" },
    }[variant];

    return (
        <div
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium"
            style={{ background: colors.bg, border: `0.5px solid ${colors.border}`, color: colors.text }}
        >
            <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: colors.dot, animation: "pulseRing 1.5s ease-in-out infinite" }}
            />
            {label}
        </div>
    );
};

const AnimStyles = () => (
    <style>{`
        @keyframes floatUp { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes waveHand { 0%,100%{transform:rotate(0deg)} 20%{transform:rotate(-20deg)} 40%{transform:rotate(16deg)} 60%{transform:rotate(-10deg)} 80%{transform:rotate(8deg)} }
        @keyframes pulseRing { 0%,100%{opacity:.5;transform:scale(1)} 50%{opacity:1;transform:scale(1.04)} }
        @keyframes barDot { 0%,80%,100%{transform:scaleY(.4)} 40%{transform:scaleY(1)} }
        @keyframes fadeSlideUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes orbDrift1 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(20px,-30px) scale(1.08)} }
        @keyframes orbDrift2 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-25px,20px) scale(1.05)} }
        @keyframes orbDrift3 { 0%,100%{transform:translate(0,0) scale(1.05)} 50%{transform:translate(15px,25px) scale(1)} }
    `}</style>
);

export default StreamPlayerEmptyState;
