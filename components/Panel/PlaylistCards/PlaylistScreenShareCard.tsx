import React from "react";
import { LuX } from "react-icons/lu";
import { FaBroadcastTower } from "react-icons/fa";
import { useTranslations } from "@/i18n/I18nProvider";

interface PlaylistScreenShareCardProps {
    platformName: string;
    platformLogo: React.ReactNode;
    platformBgStyle: React.CSSProperties;
    isPlaying: boolean;
    onStop?: () => void;
    isHost: boolean;
}

export const PlaylistScreenShareCard: React.FC<PlaylistScreenShareCardProps> = ({
    platformName,
    platformLogo,
    platformBgStyle,
    isPlaying,
    onStop,
    isHost,
}) => {
    return (
        <div
            className={`
                w-full flex gap-3 rounded-xl p-2 transition-all duration-200 h-[72px] shrink-0 relative group
                ${isPlaying
                    ? 'bg-gradient-to-r from-rose-600/20 via-pink-600/20 to-fuchsia-600/20 border border-pink-500/30'
                    : 'bg-white/5 border border-transparent'
                }
            `}
        >
            {/* Platform Logo */}
            <div
                className={`
                    relative w-20 h-13 rounded-lg overflow-hidden shrink-0 flex items-center justify-center
                    ${isPlaying ? 'ring-2 ring-pink-500/50' : ''}
                `}
                style={platformBgStyle}
            >
                <div className="text-white text-2xl">
                    {platformLogo}
                </div>
                
                {/* Streaming indicator overlay */}
                {isPlaying && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-1">
                            <div className="w-6 h-6 rounded-full bg-pink-500 flex items-center justify-center">
                                <FaBroadcastTower className="text-white" size={10} />
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
                        <span className="flex-shrink-0 px-1.5 py-0.5 text-[10px] font-medium bg-pink-500/20 text-pink-400 rounded">
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
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 self-center bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 transition-all duration-200 group-hover:scale-110"
                    title={t("stopScreenSharing")}
                >
                    <LuX size={12} />
                </button>
            ) : (
                <div className={`
                    w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 self-center
                    ${isPlaying
                        ? 'bg-pink-500/20 text-pink-400'
                        : 'bg-white/5 text-gray-500'
                    }
                `}>
                    <FaBroadcastTower size={12} />
                </div>
            )}
        </div>
    );
};

