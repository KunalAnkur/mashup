import React, { useCallback, useEffect, useRef, useState } from "react";
import { isMobile } from "react-device-detect";
import { formatVideoTime } from "@/utils/timeFormatter";

interface ProgressBarProps {
    progress: number;
    buffered: number;
    isBuffering: boolean;
    seekTo: (percent: number) => void;
    handleSeekStart: () => void;
    handleSeekEnd: () => void;
    duration: number;
    showTime?: boolean;
    showFullscreen?: boolean;
    fullscreen?: boolean;
    onFullscreenToggle?: () => void;
    onUserActivity?: () => void;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
    progress,
    buffered,
    isBuffering,
    seekTo,
    handleSeekStart,
    handleSeekEnd,
    duration,
    showTime = false,
    showFullscreen = false,
    fullscreen = false,
    onFullscreenToggle,
    onUserActivity,
}) => {
    const progressBarRef = useRef<HTMLDivElement | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragPercent, setDragPercent] = useState<number | null>(null);
    const [hoverPosition, setHoverPosition] = useState<number | null>(null);
    const [hoverPercent, setHoverPercent] = useState(0);

    const getPercentFromClientX = useCallback((clientX: number) => {
        if (!progressBarRef.current) return 0;

        const rect = progressBarRef.current.getBoundingClientRect();
        if (rect.width <= 0) return 0;

        const x = Math.min(Math.max(clientX - rect.left, 0), rect.width);
        return (x / rect.width) * 100;
    }, []);

    const updateHover = useCallback((clientX: number) => {
        if (!progressBarRef.current) return;

        const rect = progressBarRef.current.getBoundingClientRect();
        if (rect.width <= 0) return;

        const x = Math.min(Math.max(clientX - rect.left, 0), rect.width);
        const tooltipX = Math.min(Math.max(x, 14), rect.width - 14);

        setHoverPosition(tooltipX);
        setHoverPercent((x / rect.width) * 100);
    }, []);

    const startDrag = useCallback((clientX: number) => {
        setIsDragging(true);
        handleSeekStart();
        onUserActivity?.();
        setDragPercent(getPercentFromClientX(clientX));
        updateHover(clientX);
    }, [getPercentFromClientX, handleSeekStart, onUserActivity, updateHover]);

    const stopDrag = useCallback(() => {
        if (!isDragging) return;
        handleSeekEnd();
        setIsDragging(false);
        setHoverPosition(null);
        if (dragPercent !== null) {
            seekTo(dragPercent);
            setDragPercent(null);
        }
    }, [dragPercent, handleSeekEnd, isDragging, seekTo]);

    const onDrag = useCallback((event: PointerEvent) => {
        if (!isDragging) return;
        onUserActivity?.();
        setDragPercent(getPercentFromClientX(event.clientX));
        updateHover(event.clientX);
    }, [getPercentFromClientX, isDragging, onUserActivity, updateHover]);

    const onMouseDrag = useCallback((event: MouseEvent) => {
        if (!isDragging) return;
        onUserActivity?.();
        setDragPercent(getPercentFromClientX(event.clientX));
        updateHover(event.clientX);
    }, [getPercentFromClientX, isDragging, onUserActivity, updateHover]);

    const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
        if (event.pointerType === "mouse" && event.button !== 0) return;
        event.preventDefault();
        event.currentTarget.setPointerCapture?.(event.pointerId);
        startDrag(event.clientX);
    };

    const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
        updateHover(event.clientX);
    };

    useEffect(() => {
        if (isDragging) {
            window.addEventListener("pointermove", onDrag);
            window.addEventListener("pointerup", stopDrag);
            window.addEventListener("pointercancel", stopDrag);
            window.addEventListener("mousemove", onMouseDrag);
            window.addEventListener("mouseup", stopDrag);
        }

        return () => {
            window.removeEventListener("pointermove", onDrag);
            window.removeEventListener("pointerup", stopDrag);
            window.removeEventListener("pointercancel", stopDrag);
            window.removeEventListener("mousemove", onMouseDrag);
            window.removeEventListener("mouseup", stopDrag);
        };
    }, [isDragging, onDrag, onMouseDrag, stopDrag]);

    const handleVisibility = isMobile
        ? "opacity-100"
        : "opacity-0 group-hover/progress:opacity-100";
    const displayProgress = isDragging && dragPercent !== null ? dragPercent : progress;

    const showTopRow = isMobile && (showTime || showFullscreen);
    const currentTime = formatVideoTime((displayProgress / 100) * duration || 0);
    const totalTime = formatVideoTime(duration || 0);
    const topRowJustify = showTime && showFullscreen
        ? "justify-between"
        : showFullscreen
            ? "justify-end"
            : "justify-start";

    const handleFullscreenClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        event.stopPropagation();
        onFullscreenToggle?.();
    };

    const handleFullscreenPointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
        event.preventDefault();
        event.stopPropagation();
    };

    return (
        <div className="flex flex-col gap-1 ">
            {showTopRow && (
                <div className={`flex items-center ${topRowJustify}`}>
                    {showTime && (
                        <div className="rounded-md bg-black/45 px-2 py-0.5 text-[12px] font-medium text-white/90 backdrop-blur-sm">
                            <span className="tabular-nums">{currentTime}</span>
                            <span className="mx-1 text-white/50">/</span>
                            <span className="tabular-nums text-white/70">{totalTime}</span>
                        </div>
                    )}

                    {showFullscreen && (
                        <button
                            type="button"
                            onClick={handleFullscreenClick}
                            onPointerDown={handleFullscreenPointerDown}
                            title={fullscreen ? "Exit fullscreen" : "Fullscreen"}
                            aria-label={fullscreen ? "Exit fullscreen" : "Fullscreen"}
                            className="flex h-7 w-7 items-center justify-center rounded-full bg-black/45 text-white/90 backdrop-blur-sm transition-transform active:scale-95"
                        >
                            <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                className="h-4 w-4"
                            >
                                {fullscreen ? (
                                    <>
                                        <path d="M10 4H4v6" />
                                        <path d="m4 4 7 7" />
                                        <path d="M14 20h6v-6" />
                                        <path d="m20 20-7-7" />
                                        <path d="M14 4h6v6" />
                                        <path d="m20 4-7 7" />
                                        <path d="M10 20H4v-6" />
                                        <path d="m4 20 7-7" />
                                    </>
                                ) : (
                                    <>
                                        <path d="M8 4H4v4" />
                                        <path d="M4 4l6 6" />
                                        <path d="M16 20h4v-4" />
                                        <path d="m20 20-6-6" />
                                        <path d="M16 4h4v4" />
                                        <path d="m20 4-6 6" />
                                        <path d="M8 20H4v-4" />
                                        <path d="m4 20 6-6" />
                                    </>
                                )}
                            </svg>
                        </button>
                    )}
                </div>
            )}

            <div
                ref={progressBarRef}
                className="group/progress relative h-6 cursor-pointer select-none touch-none sm:h-10"
                onPointerMove={handlePointerMove}
                onPointerLeave={() => !isDragging && setHoverPosition(null)}
                onPointerDown={handlePointerDown}
                onPointerUp={stopDrag}
                onPointerCancel={stopDrag}
            >
                {!isMobile && hoverPosition !== null && (
                    <div
                        className="pointer-events-none absolute bottom-full mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-black/70 px-2 py-1 text-[11px] font-medium text-white/90 backdrop-blur-md"
                        style={{ left: hoverPosition }}
                    >
                        {formatVideoTime((hoverPercent / 100) * duration)}
                    </div>
                )}

                <div className="absolute left-0 right-0 top-1/2 h-[2px] -translate-y-1/2 rounded-full bg-white/35 transition-all duration-150 group-hover/progress:h-[3px]">
                    <div
                        className="absolute inset-y-0 left-0 rounded-full bg-white/45"
                        style={{ width: `${buffered}%` }}
                    />

                    {isBuffering && (
                        <div className="absolute inset-0 overflow-hidden rounded-full">
                            <div className="h-full w-[180%] animate-[shimmer_1.2s_linear_infinite] bg-[linear-gradient(105deg,transparent_20%,rgba(255,255,255,0.3)_48%,transparent_72%)]" />
                        </div>
                    )}

                    <div
                        className="absolute inset-y-0 left-0 rounded-full"
                        style={{
                            width: `${displayProgress}%`,
                            background: "linear-gradient(to right, #7c3aed, #ec4899)",
                        }}
                    >
                        <div
                            className={`absolute right-0 top-1/2 h-4 w-[2.5px] -translate-y-1/2 translate-x-1/2 rounded-full bg-white shadow-[0_0_8px_rgba(236,72,153,0.85)] transition-opacity duration-150 ${handleVisibility}`}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProgressBar;
