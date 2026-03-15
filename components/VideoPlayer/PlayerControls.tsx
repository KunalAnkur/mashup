import type { ReactNode } from "react";
import { isMobile } from "react-device-detect";
import { ControlComponents } from "./Player";

const IconPlay = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
        <path d="M8 5v14l11-7z" />
    </svg>
);

const IconPause = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
        <rect x="6" y="4" width="4" height="16" rx="1" />
        <rect x="14" y="4" width="4" height="16" rx="1" />
    </svg>
);

const IconVolume = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
        <path d="M3 9v6h4l5 5V4L7 9H3zm12 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
    </svg>
);

const IconMute = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
        <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
    </svg>
);

const IconExpand = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
        <path d="M8 4H4v4" />
        <path d="M4 4l6 6" />
        <path d="M16 20h4v-4" />
        <path d="m20 20-6-6" />
        <path d="M16 4h4v4" />
        <path d="m20 4-6 6" />
        <path d="M8 20H4v-4" />
        <path d="m4 20 6-6" />
    </svg>
);

const IconCompress = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
        <path d="M10 4H4v6" />
        <path d="m4 4 7 7" />
        <path d="M14 20h6v-6" />
        <path d="m20 20-7-7" />
        <path d="M14 4h6v6" />
        <path d="m20 4-7 7" />
        <path d="M10 20H4v-6" />
        <path d="m4 20 7-7" />
    </svg>
);

interface PlayerControlsProps {
    playing: boolean;
    muted: boolean;
    volume: number;
    progress: number;
    duration: number;
    fullscreen: boolean;
    onPlayPause: () => void;
    onMuteToggle: () => void;
    onVolumeChange: (volume: number) => void;
    onFullscreenToggle: () => void;
    formatTime: (seconds: number) => string;
    hideControls: ControlComponents[];
}

const CtrlBtn = ({
    onClick,
    title,
    children,
    className = "",
    active = false,
}: {
    onClick: () => void;
    title: string;
    children: ReactNode;
    className?: string;
    active?: boolean;
}) => (
    <button
        type="button"
        onClick={onClick}
        title={title}
        aria-label={title}
        className={`flex h-7 w-7 items-center justify-center rounded-xl text-white/90 transition-all duration-150 active:scale-95 sm:h-8 sm:w-8 ${active ? "bg-white/20" : "hover:bg-white/12"
            } ${className}`}
    >
        {children}
    </button>
);

const PlayerControls = ({
    playing,
    muted,
    volume,
    progress,
    duration,
    fullscreen,
    onPlayPause,
    onMuteToggle,
    onVolumeChange,
    onFullscreenToggle,
    formatTime,
    hideControls,
}: PlayerControlsProps) => {
    const currentTime = formatTime((progress / 100) * duration || 0);
    const totalTime = formatTime(duration || 0);

    const showPlay = !isMobile && !hideControls.includes(ControlComponents.PLAY);
    const showDuration = !isMobile && !hideControls.includes(ControlComponents.DURATION);
    const showVolume = !isMobile && !hideControls.includes(ControlComponents.VOLUME);
    const showFullscreen = !isMobile && !hideControls.includes(ControlComponents.FULLSCREEN);
    const hasRightPill = showVolume || showFullscreen;

    return (
        <div className="mt-1 flex items-center justify-between gap-2 sm:mt-2">
            <div className="flex min-w-0 items-center gap-2">
                {showPlay && (
                    <div className="rounded-2xl bg-[rgba(14,17,24,0.72)] px-1.5 py-1 backdrop-blur-lg shadow-[0_8px_22px_rgba(0,0,0,0.35)]">
                        <CtrlBtn onClick={onPlayPause} title={playing ? "Pause" : "Play"} active={playing}>
                            {playing ? <IconPause /> : <IconPlay />}
                        </CtrlBtn>
                    </div>
                )}

                {showDuration && (
                    <div className="rounded-2xl bg-[rgba(36,42,53,0.55)] px-3 py-2 text-[13px] font-medium text-white/90 backdrop-blur-md shadow-[0_8px_22px_rgba(0,0,0,0.25)]">
                        <span className="tabular-nums">{currentTime}</span>
                        <span className="mx-1 text-white/50">/</span>
                        <span className="tabular-nums text-white/75">{totalTime}</span>
                    </div>
                )}
            </div>

            {hasRightPill && (
                <div className="flex items-center gap-2 rounded-2xl bg-[rgba(14,17,24,0.72)] px-2 py-1 backdrop-blur-lg shadow-[0_8px_22px_rgba(0,0,0,0.35)] sm:px-2.5 sm:py-1.5">
                    {showVolume && (
                        <div className="group/vol flex items-center gap-2">
                            <CtrlBtn onClick={onMuteToggle} title={muted ? "Unmute" : "Mute"}>
                                {muted ? <IconMute /> : <IconVolume />}
                            </CtrlBtn>

                            <div className="relative hidden h-[2px] w-16 cursor-pointer rounded-full bg-white/35 md:block">
                                <div
                                    className="absolute inset-y-0 left-0 rounded-full bg-white"
                                    style={{ width: `${muted ? 0 : volume * 100}%` }}
                                >
                                    <div className="absolute right-0 top-1/2 h-2 w-2 -translate-y-1/2 translate-x-1/2 rounded-full bg-white" />
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.01"
                                    value={muted ? 0 : volume}
                                    onChange={(event) => onVolumeChange(parseFloat(event.target.value))}
                                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                                    aria-label="Volume"
                                />
                            </div>
                        </div>
                    )}

                    {showFullscreen && (
                        <CtrlBtn onClick={onFullscreenToggle} title={fullscreen ? "Exit fullscreen" : "Fullscreen"}>
                            {fullscreen ? <IconCompress /> : <IconExpand />}
                        </CtrlBtn>
                    )}
                </div>
            )}
        </div>
    );
};

export default PlayerControls;
