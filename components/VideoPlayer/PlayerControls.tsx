import type { ReactNode } from "react";
import { isMobile } from "react-device-detect";
import { ControlComponents } from "./Player";
import { FaPlay, FaPause, FaVolumeMute, FaVolumeUp, FaExpandAlt, FaCompressAlt, FaStore } from "react-icons/fa"
import { MdPlayDisabled } from "react-icons/md";

interface PlayerControlsProps {
    playing: boolean;
    muted: boolean;
    volume: number;
    progress: number;
    duration: number;
    fullscreen: boolean;
    showStore: boolean;
    onPlayPause: () => void;
    onMuteToggle: () => void;
    onVolumeChange: (volume: number) => void;
    onFullscreenToggle: () => void;
    onOpenStore?: () => void;
    onHiddingFullControls?: () => void;
    formatTime: (seconds: number) => string;
    hideControls: ControlComponents[];
    showHidingControlsBtn?: boolean
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
        className={`flex h-7 w-7 items-center justify-center rounded-xl text-white/90 transition-all duration-150 active:scale-95 sm:h-8 sm:w-8 ${className}`}
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
    showStore = true,
    onPlayPause,
    onMuteToggle,
    onVolumeChange,
    onFullscreenToggle,
    formatTime,
    hideControls,
    onHiddingFullControls,
    showHidingControlsBtn = true,
    onOpenStore
}: PlayerControlsProps) => {
    const currentTime = formatTime((progress / 100) * duration || 0);
    const totalTime = formatTime(duration || 0);

    const showPlay = !isMobile && !hideControls.includes(ControlComponents.PLAY);
    const showDuration = !isMobile && !hideControls.includes(ControlComponents.DURATION);
    const showVolume = !isMobile && !hideControls.includes(ControlComponents.VOLUME);
    const showFullscreen = !isMobile && !hideControls.includes(ControlComponents.FULLSCREEN);
    const hasRightPill = showVolume || showFullscreen;
    return (
        <div className=" flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
                {showPlay && (
                    <div className="rounded-2xl bg-black/30 px-1 py-1 backdrop-blur-lg shadow-[0_8px_22px_rgba(0,0,0,0.35)]">
                        <CtrlBtn onClick={onPlayPause} title={playing ? "Pause" : "Play"} active={playing}>
                            {playing ? <FaPause size={15} /> : <FaPlay size={15} />}
                        </CtrlBtn>
                    </div>
                )}

                {showDuration && (
                    <div className="rounded-2xl bg-black/30 px-3 py-[10.25px] text-[13px] font-medium text-white/90 backdrop-blur-md shadow-[0_8px_22px_rgba(0,0,0,0.25)]">
                        <span className="tabular-nums">{currentTime}</span>
                        <span className="mx-1 text-white/50">/</span>
                        <span className="tabular-nums text-white/75">{totalTime}</span>
                    </div>
                )}
            </div>
            {!isMobile && showStore && <button onClick={() => onOpenStore?.()} className="z-50 cursor-pointer gap-2  absolute left-1/2 -translate-x-1/2 rounded-2xl bg-black/30 h-[40px] w-[40px] flex justify-center items-center font-medium text-white/90 backdrop-blur-md shadow-[0_8px_22px_rgba(0,0,0,0.25)]">
                <FaStore />
            </button>}
            {hasRightPill && (
                <div className="flex items-center gap-2 rounded-2xl bg-black/30 px-2 py-1 backdrop-blur-lg shadow-[0_8px_22px_rgba(0,0,0,0.35)]">
                    {showVolume && (
                        <div className="group/vol flex items-center hover:pl-2 gap-2">
                            <div className="relative hidden h-4 w-0 cursor-pointer items-center overflow-hidden transition-[width] duration-200 ease-in-out group-hover/vol:w-16 md:flex">
                                {/* Track background */}
                                <div className="absolute inset-x-0 top-1/2 h-[2px] -translate-y-1/2 rounded-full bg-white/35">
                                    {/* Fill */}
                                    <div
                                        className="absolute inset-y-0 left-0 rounded-full bg-white"
                                        style={{ width: `${muted ? 0 : volume * 100}%` }}
                                    >
                                        {/* Thumb dot */}
                                        <div className="absolute right-0 top-1/2 h-2 w-2 -translate-y-1/2 translate-x-1/2 rounded-full bg-white" />
                                    </div>
                                </div>
                                {/* Full-height input for easy grabbing */}
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
                            <CtrlBtn onClick={onMuteToggle} title={muted ? "Unmute" : "Mute"}>
                                {muted ? <FaVolumeMute size={18} /> : <FaVolumeUp size={18} />}
                            </CtrlBtn>
                        </div>
                    )}
                    
                    {showHidingControlsBtn && <CtrlBtn onClick={() => onHiddingFullControls?.()} title={"Hide controls"}>
                        <MdPlayDisabled size={24}/>
                    </CtrlBtn>}
                    
                    {showFullscreen && (
                        <CtrlBtn onClick={onFullscreenToggle} title={fullscreen ? "Exit fullscreen" : "Fullscreen"}>
                            {fullscreen ? <FaCompressAlt size={18} /> : <FaExpandAlt size={18} />}
                        </CtrlBtn>
                    )}
                </div>
            )}
        </div>
    );
};

export default PlayerControls;
