import ProgressBar from "@/components/VideoPlayer/ProgressBar";
import PlayerControls from "@/components/VideoPlayer/PlayerControls";
import { ControlComponents } from "./Player";
import { Share2, SkipForward } from "lucide-react";

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
  hideControls = [],
}: ControlBarProps) => {
  const handleShare = () => {
    // TODO: Implement share functionality
    console.log("Share clicked");
  };

  const handleNextVideo = () => {
    // TODO: Implement next video functionality
    console.log("Next video clicked");
  };

  return (
    <div
      className={`absolute bottom-0 left-0 right-0 z-30 bg-gradient-to-t from-black/90 via-black/70 to-transparent px-6 py-4 transition-all duration-300 ${
        showControls ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
      }`}
      style={{ pointerEvents: showControls ? "auto" : "none" }}
    >
      {/* Progress Bar */}
      {!hideControls.includes(ControlComponents.PROGRESS) && (
        <div className="mb-4">
          <ProgressBar
            progress={progress}
            buffered={buffered}
            isBuffering={isBuffering}
            seekTo={onSeekTo}
            handleSeekStart={onSeekStart}
            handleSeekEnd={onSeekEnd}
            duration={duration}
          />
        </div>
      )}

      {/* Controls Row */}
      <div className="flex items-center justify-between">
        {/* Left Side - Player Controls */}
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

        {/* Right Side - Share & Next Video Buttons */}
        <div className="flex items-center gap-3">
          {/* Share Button */}
          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 rounded-lg transition-all font-medium text-white text-sm"
          >
            <Share2 className="w-4 h-4" />
            <span>Share</span>
          </button>

          {/* Next Video Button */}
          <button
            onClick={handleNextVideo}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-rose-600 via-pink-600 to-fuchsia-600 hover:from-rose-700 hover:via-pink-700 hover:to-fuchsia-700 rounded-lg transition-all font-medium text-white text-sm shadow-lg"
          >
            <span>Next Video</span>
            <SkipForward className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
