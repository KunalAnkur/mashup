import { FaPlay, FaPause, FaVolumeMute, FaVolumeUp, FaExpand, FaCompress } from "react-icons/fa";

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
}

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
}: PlayerControlsProps) => (
    <div className="flex items-center pt-2 justify-between shadow-lg rounded-xl">
        <div className="flex items-center gap-4 text-white">
            <button
                onClick={onPlayPause}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
                aria-label={playing ? "Pause" : "Play"}
            >
                {playing ? <FaPause size={18} /> : <FaPlay size={18} />}
            </button>

            <div className="flex items-center gap-2 group/volume">
                <button
                    onClick={onMuteToggle}
                    className="p-2 hover:bg-white/20 rounded-full transition-colors"
                    aria-label={muted ? "Unmute" : "Mute"}
                >
                    {muted ? <FaVolumeMute size={18} /> : <FaVolumeUp size={18} />}
                </button>
                <div className="relative w-24">
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={muted ? 0 : volume}
                        onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                        className="absolute top-0 left-0 w-full h-full opacity-0 z-10 cursor-pointer"
                    />
                    <div className="relative h-1 w-full bg-white/20 rounded-full overflow-hidden">
                        <div
                            className="absolute h-full rounded-full"
                            style={{
                                width: `${(muted ? 0 : volume) * 100}%`,
                                background: "linear-gradient(to right, #F70000, #F900E0)",
                            }}
                        >
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-2.5 h-2.5 bg-white rounded-full opacity-0 group-hover/volume:opacity-100 group-hover/volume:w-3.5 group-hover/volume:h-3.5 transition-all duration-200 shadow-md shadow-pink-400/50" />
                        </div>
                    </div>
                </div>
            </div>

            <span className="text-sm font-medium text-white/90">
                {formatTime((progress / 100) * duration)} / {formatTime(duration)}
            </span>
        </div>

        <button
            onClick={onFullscreenToggle}
            className="p-2 text-white hover:bg-white/20 rounded-full transition-colors"
            aria-label={fullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        >
            {fullscreen ? <FaCompress size={18} /> : <FaExpand size={18} />}
        </button>
    </div>
);

export default PlayerControls;