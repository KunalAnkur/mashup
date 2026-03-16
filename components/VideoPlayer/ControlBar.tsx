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
  onSeekEnd: (seekTime?: number, seekPercent?: number) => void;
  onPlayPause: () => void;
  onMuteToggle: () => void;
  onVolumeChange: (volume: number) => void;
  onFullscreenToggle: () => void;
  formatTime: (seconds: number) => string;
  hideControls: ControlComponents[];
  onUserActivity?: () => void;
}

export const ControlBar = ({
  showControls, progress, buffered, isBuffering,
  playing, muted, volume, duration, fullscreen,
  onSeekTo, onSeekStart, onSeekEnd, onPlayPause,
  onMuteToggle, onVolumeChange, onFullscreenToggle,
  formatTime, hideControls = [], onUserActivity,
}: ControlBarProps) => {
  const controlsVisibility = showControls
    ? "translate-y-0 opacity-100"
    : "pointer-events-none translate-y-3 opacity-0";

  return (
    <div
      className={`absolute inset-x-0 bottom-0 z-30 px-3 pb-2 transition-all duration-300 ease-out sm:px-4 sm:pb-9 ${controlsVisibility}`}
    >
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/65 via-black/25 to-transparent sm:h-32" />

        <ProgressBar
          progress={progress}
          buffered={buffered}
          isBuffering={isBuffering}
          seekTo={onSeekTo}
          handleSeekStart={onSeekStart}
          handleSeekEnd={onSeekEnd}
          duration={duration}
          showTime={!hideControls.includes(ControlComponents.DURATION)}
          showFullscreen={!hideControls.includes(ControlComponents.FULLSCREEN)}
          showProgressBar={!hideControls.includes(ControlComponents.PROGRESS)}
          fullscreen={fullscreen}
          onFullscreenToggle={onFullscreenToggle}
          onUserActivity={onUserActivity}
        />

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
};
