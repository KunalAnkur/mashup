import React from "react";
import { LuRadioTower, LuX } from "react-icons/lu";
import { useTranslations } from "@/i18n/I18nProvider";
import {
    playlistCardBaseClass,
    playlistCardIdleSurfaceClass,
    playlistCardIndexPlayingClass,
    playlistCardPlayingBadgeClass,
    playlistCardPlayingIndicatorClass,
    playlistCardPlayingOverlayClass,
    playlistCardPlayingSurfaceClass,
    playlistCardThumbnailBaseClass,
    playlistCardThumbnailRingClass,
} from "./playlistCardStyles";

interface PlaylistScreenShareCardProps {
    platformName: string;
    platformLogo: React.ReactNode;
    platformBgStyle: React.CSSProperties;
    isPlaying: boolean;
    onStop?: () => void;
    isHost: boolean;
}

const playlistScreenShareStopButtonClass =
    "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 self-center bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 transition-all duration-200 group-hover:scale-110";
const playlistScreenShareIdleBadgeClass =
    "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 self-center";

export const PlaylistScreenShareCard: React.FC<PlaylistScreenShareCardProps> = ({
    platformName,
    platformLogo,
    platformBgStyle,
    isPlaying,
    onStop,
    isHost,
}) => {
    const t = useTranslations("panel.playlist");
    return (
        <div
            className={`
                ${playlistCardBaseClass} relative
                ${isPlaying
                    ? playlistCardPlayingSurfaceClass
                    : playlistCardIdleSurfaceClass
                }
            `}
        >
            {/* Platform Logo */}
            <div
                className={`
                    ${playlistCardThumbnailBaseClass} flex items-center justify-center
                    ${isPlaying ? playlistCardThumbnailRingClass : ''}
                `}
                style={platformBgStyle}
            >
                <div className="text-white text-2xl">
                    {platformLogo}
                </div>
                
                {/* Streaming indicator overlay */}
                {isPlaying && (
                    <div className={playlistCardPlayingOverlayClass}>
                        <div className="flex flex-col items-center gap-1">
                            <div className={playlistCardPlayingIndicatorClass}>
                                <LuRadioTower className="text-white" size={10} />
                            </div>
                            <div className="w-1 h-1 rounded-full bg-pink-500 animate-pulse"></div>
                        </div>
                    </div>
                )}
            </div>

            {/* Platform info */}
            <div className="flex flex-col gap-0.5 min-w-0 flex-1 justify-center overflow-hidden text-left">
                <div className="flex items-center gap-2">
                    <p className={`text-xs font-semibold line-clamp-1 leading-tight ${
                        isPlaying ? 'text-pink-400' : 'text-gray-200'
                    }`}>
                        {platformName}
                    </p>
                    {isPlaying && (
                        <span className={playlistCardPlayingBadgeClass}>
                            {t("streaming")}
                        </span>
                    )}
                </div>
                <p className="text-gray-500 text-[10px] truncate">
                    {t("screenSharingActive")}
                </p>
            </div>

            {/* Stop button or Streaming icon */}
            {isHost && onStop ? (
                <button
                    onClick={onStop}
                    className={playlistScreenShareStopButtonClass}
                    title={t("stopScreenSharing")}
                >
                    <LuX size={12} />
                </button>
            ) : (
                <div className={`
                    ${playlistScreenShareIdleBadgeClass}
                    ${isPlaying
                        ? playlistCardIndexPlayingClass
                        : 'bg-white/5 text-gray-500'
                    }
                `}>
                    <LuRadioTower size={12} />
                </div>
            )}
        </div>
    );
};
