"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { RoomType } from "@/context/RoomContext";
import getPlayerMessage from "@/utils/playerState";
import { Playlist } from "@/types/storeTypes";
import { ContentSelection } from "@/components/Panel/PlaylistTab/ContentSelection";
import { usePlaylistActions } from "@/hooks/usePlaylistActions";
import * as constants from "@/constants";
const logo = constants.assets.logo;

// ─── Types ────────────────────────────────────────────────────────────────────

type StreamPlayerEmptyStateProps = {
    isHost: boolean;
    roomType: RoomType | null;
    hostLeft: boolean;
    playlist?: Playlist[];
    remoteStream: MediaStream | null;
    isInitialized: boolean;
};

/**
 *? ─── Main Component ───────────────────────────────────────────────────────────
 ** Render decision tree:
 ** 1. isLoading === true           → <LoadingScreen />
 ** 2. hostLeft && !isHost          → <HostLeftScreen />
 ** 3. isHost && playlist.length=0  → <HostEmptyPlaylistScreen />
 ** 4. isHost && playlist.length>0  → <HostPreparingScreen />
 ** 5. !isHost (viewer waiting)     → <ViewerWaitingScreen />
 *? ─────────────────────────────────────────────────────────────────────────────
 */
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
        if (isHostWithoutPlaylist || (hostLeft && !isHost)) {
            setIsLoading(false);
            setContentVisible(true);
            return;
        }
        const loaderTimer = setTimeout(() => setIsLoading(false), 2200);
        const contentTimer = setTimeout(() => setContentVisible(true), 2500);
        return () => {
            clearTimeout(loaderTimer);
            clearTimeout(contentTimer);
        };
    }, [hostLeft, isHost, isHostWithoutPlaylist]);

    if (isLoading) return <LoadingScreen />;

    if (hostLeft && !isHost) {
        const message = getPlayerMessage(isHost, roomType || "sync", hostLeft, remoteStream) as string;
        return <HostLeftScreen message={message} contentVisible={contentVisible} />;
    }

    if (isHostWithoutPlaylist) {
        return (
            <HostEmptyPlaylistScreen
                contentVisible={contentVisible}
                onAddContent={addPlaylistContent}
                onScreenShareStopped={handleScreenShareStopped}
            />
        );
    }

    if (isHost) return <HostPreparingScreen contentVisible={contentVisible} />;

    return <ViewerWaitingScreen contentVisible={contentVisible} isInitialized={isInitialized} />;
};

// ─── Screen Components ────────────────────────────────────────────────────────

const LoadingScreen = () => (
    <ScreenShell>
        <GlobalStyles />
        <div className="sp-loader">
            {/* Concentric scanner rings */}
            <div className="sp-rings">
                <span className="sp-ring sp-ring--1" />
                <span className="sp-ring sp-ring--2" />
                <span className="sp-ring sp-ring--3" />
                {/* Logo at center */}
                <div className="sp-logo-wrap">
                    <Image src={logo} alt="Logo" width={36} height={36} className="sp-logo-img" />
                </div>
            </div>

            {/* Segmented progress bar */}
            <div className="sp-progress">
                <div className="sp-progress-fill" />
            </div>

            <p className="sp-loading-label">Initializing stream</p>
        </div>
    </ScreenShell>
);

// ─────────────────────────────────────────────────────────────────────────────

const HostLeftScreen = ({
    message,
    contentVisible,
}: {
    message: string;
    contentVisible: boolean;
}) => (
    <ScreenShell>
        <GlobalStyles />
        <FadeInContent visible={contentVisible}>
            {/* Logo mark with a subtle "ended" indicator */}
            <BrandMark variant="ended" />

            <div className="sp-chip">Session ended</div>

            <h2 className="sp-heading">
                That was <span className="sp-accent">incredible.</span>
            </h2>

            <p className="sp-body">{message || "The host has left the room."}</p>

            <p className="sp-hint">Want to watch something else with friends?</p>

            <Link href="/" className="sp-cta-btn">
                Create another room
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
            </Link>
        </FadeInContent>
    </ScreenShell>
);

// ─────────────────────────────────────────────────────────────────────────────

const HostEmptyPlaylistScreen = ({
    contentVisible,
    onAddContent,
    onScreenShareStopped,
}: {
    contentVisible: boolean;
    onAddContent: ReturnType<typeof usePlaylistActions>["addPlaylistContent"];
    onScreenShareStopped: ReturnType<typeof usePlaylistActions>["handleScreenShareStopped"];
}) => (
    <ScreenShell>
        <GlobalStyles />
        <FadeInContent visible={contentVisible}>
            <BrandMark variant="idle" />

            <h2 className="sp-heading">
                Your playlist is <span className="sp-accent">empty.</span>
            </h2>

            <p className="sp-body">
                Add a URL, upload files, or share your screen to start streaming.
            </p>

            <div className="sp-content-sel">
                <ContentSelection
                    onAddContent={onAddContent}
                    onScreenShareStopped={onScreenShareStopped}
                />
            </div>
        </FadeInContent>
    </ScreenShell>
);

// ─────────────────────────────────────────────────────────────────────────────

const HostPreparingScreen = ({ contentVisible }: { contentVisible: boolean }) => (
    <ScreenShell>
        <GlobalStyles />
        <FadeInContent visible={contentVisible}>
            <BrandMark variant="active" />

            <h2 className="sp-heading">
                Setting up your <span className="sp-accent">stream.</span>
            </h2>

            <p className="sp-body">Your stream is being prepared. Viewers are waiting.</p>

            <AudioWave />

            <StatusPill variant="purple" label="Preparing stream" />
        </FadeInContent>
    </ScreenShell>
);

// ─────────────────────────────────────────────────────────────────────────────

const ViewerWaitingScreen = ({
    contentVisible,
    isInitialized,
}: {
    contentVisible: boolean;
    isInitialized: boolean;
}) => (
    <ScreenShell>
        <GlobalStyles />
        <FadeInContent visible={contentVisible}>
            <BrandMark variant={isInitialized ? "active" : "idle"} />

            <h2 className="sp-heading">
                Waiting for the <span className="sp-accent">host.</span>
            </h2>

            <p className="sp-body">
                {isInitialized
                    ? "You're connected and ready. The stream will begin shortly."
                    : "The host hasn't started yet. You'll be connected automatically."}
            </p>

            <AudioWave />

            {isInitialized && <StatusPill variant="green" label="Ready to receive stream" />}
        </FadeInContent>
    </ScreenShell>
);

// ─── Shared UI Primitives ─────────────────────────────────────────────────────

const ScreenShell = ({ children }: { children: React.ReactNode }) => (
    <div className="sp-shell">
        {children}
    </div>
);

/**
 * Layered brand mark — logo with state-driven halo/indicator ring.
 * variant: "idle" | "active" | "ended"
 */
const BrandMark = ({ variant }: { variant: "idle" | "active" | "ended" }) => (
    <div className={`sp-brand sp-brand--${variant}`}>
        {/* Outer halo */}
        {/* <span className="sp-halo sp-halo--outer" /> */}
        {/* Inner ring */}
        {/* <span className="sp-halo sp-halo--inner" /> */}
        {/* Logo container */}

        <span className="sp-ring sp-ring--1" />
        <span className="sp-ring sp-ring--2" />
        <span className="sp-ring sp-ring--3" />
        <div className="sp-logo-wrap">
            <Image src={logo} alt="Logo" width={42} height={42} className="sp-logo-img" />
        </div>
        {/* State dot */}
        <span className={`sp-dot sp-dot--${variant}`} />
    </div>
);

const FadeInContent = ({
    visible,
    children,
}: {
    visible: boolean;
    children: React.ReactNode;
}) => (
    <div className="sp-content" data-visible={visible}>
        {children}
    </div>
);

/** Animated audio-wave bars (replaces equalizer dots) */
const AudioWave = () => (
    <div className="sp-wave">
        {[0, 1, 2, 3, 4].map((i) => (
            <span key={i} className="sp-wave-bar" style={{ animationDelay: `${i * 0.12}s` }} />
        ))}
    </div>
);

/** Status pill with pulsing indicator dot */
const StatusPill = ({ variant, label }: { variant: "purple" | "green"; label: string }) => (
    <div className={`sp-pill sp-pill--${variant}`}>
        <span className="sp-pill-dot" />
        {label}
    </div>
);

// ─── All CSS in one place ─────────────────────────────────────────────────────

const GlobalStyles = () => (
    <style>{`
    /* ── Shell ──────────────────────────────────────────────────── */
    .sp-shell {
        position: relative;
        width: 100%; height: 100%;
        background: transparent;
        display: flex; align-items: center; justify-content: center;
        overflow: hidden;
        font-family: -apple-system, 'Inter', 'Helvetica Neue', sans-serif;
    }

    /* ── Logo image ─────────────────────────────────────────────── */
    .sp-logo-img {
        object-fit: contain; display: block;
        filter: drop-shadow(0 0 12px rgba(139,92,246,.45));
    }

    /* ── Brand mark ─────────────────────────────────────────────── */
    .sp-brand {
        position: relative;
        display: flex; align-items: center; justify-content: center;
        width: 96px; height: 96px;
        margin-bottom: 32px;
    }
    .sp-halo {
        position: absolute; border-radius: 50%;
        border: 1px solid rgba(139,92,246,.22);
    }
    .sp-halo--outer  { width: 96px;  height: 96px; }
    .sp-halo--inner  { width: 72px;  height: 72px; }

    .sp-brand--active .sp-halo--outer {
        animation: haloBreath 2.8s ease-in-out infinite;
    }
    .sp-brand--active .sp-halo--inner {
        animation: haloBreath 2.8s ease-in-out infinite .4s;
    }
    @keyframes haloBreath {
        0%,100% { opacity:.3; transform:scale(1); }
        50%      { opacity:.8; transform:scale(1.06); }
    }

    .sp-brand-logo {
        position: relative; z-index: 2;
        width: 56px; height: 56px;
        background: rgba(255,255,255,.04);
        border: 1px solid rgba(255,255,255,.08);
        border-radius: 14px;
        display: flex; align-items: center; justify-content: center;
        backdrop-filter: blur(8px);
    }

    /* State dot (bottom-right of brand mark) */
    .sp-dot {
        position: absolute; bottom: 6px; right: 6px;
        width: 10px; height: 10px; border-radius: 50%;
        border: 2px solid #09090c;
    }
    .sp-dot--idle   { background: rgba(255,255,255,.25); }
    .sp-dot--active { background: #6ee7b7; animation: dotPulse 1.6s ease-in-out infinite; }
    .sp-dot--ended  { background: rgba(255,255,255,.15); }
    @keyframes dotPulse {
        0%,100% { box-shadow: 0 0 0 0 rgba(110,231,183,.5); }
        50%      { box-shadow: 0 0 0 5px rgba(110,231,183,0); }
    }

    /* ── Content wrapper ────────────────────────────────────────── */
    .sp-content {
        position: relative; z-index: 10;
        display: flex; flex-direction: column;
        align-items: center; text-align: center;
        padding: 0 28px; max-width: 360px;
        opacity: 0;
        transform: translateY(16px);
        transition: opacity .55s cubic-bezier(.22,1,.36,1), transform .55s cubic-bezier(.22,1,.36,1);
    }
    .sp-content[data-visible="true"] {
        opacity: 1; transform: translateY(0);
    }

    /* ── Typography ─────────────────────────────────────────────── */
    .sp-heading {
        font-size: 22px; font-weight: 600;
        line-height: 1.25; letter-spacing: -.02em;
        color: rgba(255,255,255,.88);
        margin: 0 0 10px;
    }
    .sp-accent {
        background: linear-gradient(110deg, #c4b5fd 0%, #f9a8d4 60%, #a5f3fc 100%);
        -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        background-clip: text;
    }
    .sp-body {
        font-size: 13.5px; line-height: 1.65;
        color: rgba(255,255,255,.38);
        margin: 0 0 22px;
    }
    .sp-hint {
        font-size: 12.5px;
        color: rgba(255,255,255,.26);
        margin: 0 0 16px;
    }

    /* ── Chip ───────────────────────────────────────────────────── */
    .sp-chip {
        display: inline-flex; align-items: center;
        padding: 4px 12px;
        margin-bottom: 14px;
        border-radius: 100px;
        border: 1px solid rgba(255,255,255,.1);
        background: rgba(255,255,255,.04);
        font-size: 10px; font-weight: 600;
        letter-spacing: .1em; text-transform: uppercase;
        color: rgba(255,255,255,.35);
    }

    /* ── CTA button ─────────────────────────────────────────────── */
    .sp-cta-btn {
        display: inline-flex; align-items: center; gap: 8px;
        padding: 10px 22px;
        border-radius: 10px;
        background: linear-gradient(135deg, #7c3aed 0%, #be185d 100%);
        font-size: 13.5px; font-weight: 600;
        color: #fff; text-decoration: none;
        transition: transform .18s ease, box-shadow .18s ease;
        box-shadow: 0 0 0 1px rgba(255,255,255,.07) inset,
                    0 8px 32px rgba(124,58,237,.28);
    }
    .sp-cta-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 0 0 1px rgba(255,255,255,.12) inset,
                    0 12px 40px rgba(124,58,237,.4);
    }
    .sp-cta-btn:active { transform: scale(.97); }

    /* ── Audio wave ─────────────────────────────────────────────── */
    .sp-wave {
        display: flex; align-items: center; gap: 4px;
        height: 28px; margin-bottom: 20px;
    }
    .sp-wave-bar {
        display: block;
        width: 3px; height: 10px; border-radius: 2px;
        background: linear-gradient(180deg, #a78bfa 0%, #ec4899 100%);
        animation: waveBar 1.1s ease-in-out infinite;
        transform-origin: center bottom;
    }
    @keyframes waveBar {
        0%,100% { transform: scaleY(.35); opacity:.45; }
        50%      { transform: scaleY(1);   opacity:1;   }
    }

    /* ── Status pill ────────────────────────────────────────────── */
    .sp-pill {
        display: inline-flex; align-items: center; gap: 7px;
        padding: 6px 14px; border-radius: 100px;
        font-size: 11.5px; font-weight: 500;
    }
    .sp-pill--purple {
        background: rgba(139,92,246,.1);
        border: 1px solid rgba(139,92,246,.28);
        color: rgba(216,180,254,.9);
    }
    .sp-pill--green {
        background: rgba(52,211,153,.07);
        border: 1px solid rgba(52,211,153,.22);
        color: rgba(110,231,183,.9);
    }
    .sp-pill-dot {
        width: 6px; height: 6px; border-radius: 50%;
        display: block;
    }
    .sp-pill--purple .sp-pill-dot { background: #a78bfa; animation: dotPulse 1.6s ease-in-out infinite; }
    .sp-pill--green  .sp-pill-dot { background: #34d399; animation: dotPulse 1.6s ease-in-out infinite; }

    /* ── Content selection wrapper ──────────────────────────────── */
    .sp-content-sel { width: 100%; margin-top: 6px; }

    /* ─────────── LOADING SCREEN ──────────────────────────────── */
    .sp-loader {
        position: relative; z-index: 10;
        display: flex; flex-direction: column;
        align-items: center; gap: 20px;
    }

    /* Scanner rings */
    .sp-rings {
        position: relative;
        width: 100px; height: 100px;
        display: flex; align-items: center; justify-content: center;
    }
    .sp-ring {
        position: absolute; border-radius: 50%;
        border: 1px solid transparent;
    }
    .sp-ring--1 {
        width: 100px; height: 100px;
        border-color: rgba(139,92,246,.35);
        animation: scanSpin 2s linear infinite;
        border-top-color: rgba(139,92,246,.85);
    }
    .sp-ring--2 {
        width: 74px; height: 74px;
        border-color: rgba(236,72,153,.2);
        animation: scanSpin 2.8s linear infinite reverse;
        border-right-color: rgba(236,72,153,.7);
    }
    .sp-ring--3 {
        width: 50px; height: 50px;
        border-color: rgba(99,102,241,.15);
        animation: scanSpin 4s linear infinite;
        border-bottom-color: rgba(99,102,241,.5);
    }
    @keyframes scanSpin { to { transform: rotate(360deg); } }

    .sp-logo-wrap {
        position: relative; z-index: 2;
        width: 38px; height: 38px;
        display: flex; align-items: center; justify-content: center;
    }

    /* Segmented progress bar */
    .sp-progress {
        width: 120px; height: 2px;
        background: rgba(255,255,255,.07);
        border-radius: 2px; overflow: hidden;
    }
    .sp-progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #7c3aed, #ec4899, #7c3aed);
        background-size: 200%;
        border-radius: 2px;
        animation: progFill 2.2s cubic-bezier(.4,0,.2,1) forwards,
                   progShimmer 1.4s ease-in-out infinite;
    }
    @keyframes progFill    { from{width:0%} to{width:100%} }
    @keyframes progShimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }

    .sp-loading-label {
        font-size: 10.5px; font-weight: 600; letter-spacing: .12em;
        text-transform: uppercase; color: rgba(255,255,255,.22);
        margin: 0;
    }
    `}</style>
);

export default StreamPlayerEmptyState;
