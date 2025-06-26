import ProgressBar from "@/components/VideoPlayer/ProgressBar";
import PlayerControls from "@/components/VideoPlayer/PlayerControls";
import { ControlComponents } from "./Player";

interface ControlBarProps {
    showControls: boolean;
    progress: number;
    buffered: number;
    isBuffering: boolean;
    playing: boolean;
    muted: boolean;
    volume: number;
    duration: number;
    fullscreen: boolean;
    onSeekTo: (percent: number) => void;
    onSeekStart: () => void;
    onSeekEnd: () => void;
    onPlayPause: () => void;
    onMuteToggle: () => void;
    onVolumeChange: (volume: number) => void;
    onFullscreenToggle: () => void;
    formatTime: (seconds: number) => string;
    hideControls: ControlComponents[];
}

export const ControlBar = ({
    showControls,
    progress,
    buffered,
    isBuffering,
    playing,
    muted,
    volume,
    duration,
    fullscreen,
    onSeekTo,
    onSeekStart,
    onSeekEnd,
    onPlayPause,
    onMuteToggle,
    onVolumeChange,
    onFullscreenToggle,
    formatTime,
    hideControls = []
}: ControlBarProps) => (
    <div
        className={`absolute bottom-0 left-4 right-4 z-30 p-1 rounded-xl transition-all duration-300 ${showControls ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
            }`}
        style={{ pointerEvents: showControls ? "auto" : "none" }}
    >
        {!hideControls.includes(ControlComponents.PROGRESS) &&
        <ProgressBar
            progress={progress}
            buffered={buffered}
            isBuffering={isBuffering}
            seekTo={onSeekTo}
            handleSeekStart={onSeekStart}
            handleSeekEnd={onSeekEnd}
            duration={duration}
        />}

        <PlayerControls
            playing={playing}
            muted={muted}
            volume={volume}
            progress={progress}
            duration={duration}
            fullscreen={fullscreen}
            onPlayPause={onPlayPause}
            onMuteToggle={onMuteToggle}
            onVolumeChange={onVolumeChange}
            onFullscreenToggle={onFullscreenToggle}
            formatTime={formatTime}
            hideControls={hideControls}
        />
    </div>
);