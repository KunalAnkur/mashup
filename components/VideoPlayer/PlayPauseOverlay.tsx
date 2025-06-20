import { FaPlay } from "react-icons/fa";

interface PlayPauseOverlayProps {
    playing: boolean;
    onToggle: () => void;
    onDoubleClick: () => void;
}

export const PlayPauseOverlay = ({ playing, onToggle, onDoubleClick }: PlayPauseOverlayProps) => (
    <div
        onClick={onToggle}
        onDoubleClick={onDoubleClick}
        className={`absolute top-0 left-0 right-0 p-4 h-full inset-0 flex items-center justify-center z-10`}
    >
        {!playing && (
            <div className="p-6 bg-white/20 backdrop-blur-md rounded-full cursor-pointer">
                <FaPlay size={32} className="text-white translate-x-[2px]" />
            </div>
        )}
    </div>
);