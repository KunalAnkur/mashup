import React, { useRef, useState, useEffect } from "react";
import "./ProgressAnimation.css";

interface ProgressBarProps {
    progress: number; // 0–100
    buffered: number; // 0–100
    isBuffering: boolean;
    seekTo: (percent: number) => void;
    handleSeekStart: () => void;
    handleSeekEnd: () => void;
    duration: number; // Add duration prop
}

const ProgressBar: React.FC<ProgressBarProps> = ({
    progress,
    buffered,
    isBuffering,
    seekTo,
    handleSeekStart,
    handleSeekEnd,
    duration, // Receive duration prop
}) => {
    const progressBarRef = useRef<HTMLDivElement | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [hoverPosition, setHoverPosition] = useState<number | null>(null);
    const [hoverTime, setHoverTime] = useState(0);

    const formatTime = (seconds: number): string => {
        const date = new Date(seconds * 1000);
        const hh = date.getUTCHours();
        const mm = date.getUTCMinutes();
        const ss = date.getUTCSeconds().toString().padStart(2, "0");

        if (hh) {
            return `${hh}:${mm.toString().padStart(2, "0")}:${ss}`;
        }
        return `${mm}:${ss}`;
    };

    const updateProgressFromEvent = (e: MouseEvent | React.MouseEvent) => {
        if (!progressBarRef.current) return;
        const rect = progressBarRef.current.getBoundingClientRect();
        const x = (e as MouseEvent).clientX - rect.left;
        const percentage = Math.min(Math.max(x / rect.width, 0), 1) * 100;

        // Calculate hover time
        const time = (percentage / 100) * duration;
        setHoverTime(time);

        seekTo(percentage);
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!progressBarRef.current) return;
        const rect = progressBarRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = Math.min(Math.max(x / rect.width, 0), 1) * 100;
        setHoverPosition(x);

        // Calculate hover time
        const time = (percentage / 100) * duration;
        setHoverTime(time);
    };

    const handleMouseLeave = () => {
        setHoverPosition(null);
    };

    const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
        updateProgressFromEvent(e);
    };

    const startDrag = (e: React.MouseEvent<HTMLDivElement>) => {
        setIsDragging(true);
        handleSeekStart();
        updateProgressFromEvent(e);
    };

    const stopDrag = () => {
        if (isDragging) {
            handleSeekEnd();
            setIsDragging(false);
        }
    };

    const onDrag = (e: MouseEvent) => {
        if (!isDragging) return;
        updateProgressFromEvent(e);
    };

    useEffect(() => {
        if (isDragging) {
            window.addEventListener("mousemove", onDrag);
            window.addEventListener("mouseup", stopDrag);
        } else {
            window.removeEventListener("mousemove", onDrag);
            window.removeEventListener("mouseup", stopDrag);
        }

        return () => {
            window.removeEventListener("mousemove", onDrag);
            window.removeEventListener("mouseup", stopDrag);
        };
    }, [isDragging]);

    return (
        <div className="relative group/progress" ref={progressBarRef}>
            {/* Hover timestamp preview */}
            {hoverPosition !== null && (
                <div
                    className="absolute bottom-full mb-2 px-2 py-1 text-xs text-white bg-black/80 rounded-md pointer-events-none"
                    style={{
                        left: `${hoverPosition}px`,
                        transform: 'translateX(-50%)'
                    }}
                >
                    {formatTime(hoverTime)}
                </div>
            )}

            <div
                className="absolute -top-3 -bottom-3 left-0 right-0 z-20 cursor-pointer"
                onMouseDown={startDrag}
                onClick={handleSeek}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
            />
            <div className="relative h-1 w-full overflow-hidden rounded-full group-hover/progress:h-1 transition-all duration-200 ease-out">
                <div className="absolute inset-0 bg-white/20 rounded-full" />
                {!isBuffering ? (
                    <div
                        className="absolute h-full bg-white/40 rounded-full"
                        style={{ width: `${buffered}%` }}
                    />
                ) : (
                    <div
                        className={`absolute h-full rounded-full overflow-hidden bg-[length:20px_20px] animate-stripes`}
                        style={{
                            width: "100%",
                            backgroundImage: `repeating-linear-gradient(
                                135deg,
                                rgba(255, 255, 255, 0.15) 0px,
                                rgba(255, 255, 255, 0.15) 8px,
                                transparent 8px,
                                transparent 16px
                            )`,
                        }}
                    />
                )}
                <div
                    className="absolute h-full z-10 rounded-full"
                    style={{
                        width: `${progress}%`,
                        background: "linear-gradient(to right, #F70000, #F900E0)",
                    }}
                >
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-2.5 h-2.5 bg-white rounded-full opacity-0 group-hover/progress:opacity-100 group-hover/progress:w-3.5 group-hover/progress:h-3.5 transition-all duration-200 shadow-md shadow-pink-400/50" />
                </div>
            </div>
        </div>
    );
};

export default ProgressBar;