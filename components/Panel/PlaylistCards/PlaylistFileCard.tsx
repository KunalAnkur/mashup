import React from "react";
import { LuPlay, LuFilm } from "react-icons/lu";
import { useTranslations } from "@/i18n/I18nProvider";
import {
    playlistCardBaseClass,
    playlistCardIdleSurfaceClass,
    playlistCardIdleSurfaceHoverClass,
    playlistCardIndexBaseClass,
    playlistCardIndexIdleClass,
    playlistCardIndexPlayingClass,
    playlistCardPlayingBadgeClass,
    playlistCardPlayingIndicatorClass,
    playlistCardPlayingOverlayClass,
    playlistCardPlayingSurfaceClass,
    playlistCardThumbnailBaseClass,
    playlistCardThumbnailRingClass,
} from "./playlistCardStyles";

interface PlaylistFileCardProps {
    file: File;
    index: number;
    isPlaying: boolean;
    isHost: boolean;
    thumbnail: string | null;
    onSelect: () => void;
}

const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export const PlaylistFileCard: React.FC<PlaylistFileCardProps> = ({
    file,
    index,
    isPlaying,
    isHost,
    thumbnail,
    onSelect,
}) => {
    const t = useTranslations("panel.playlist");
    return (
        <button
            onClick={onSelect}
            disabled={!isHost}
            className={`
                ${playlistCardBaseClass}
                ${isPlaying
                    ? playlistCardPlayingSurfaceClass
                    : isHost
                    ? playlistCardIdleSurfaceHoverClass
                    : playlistCardIdleSurfaceClass
                }
                ${!isHost ? 'cursor-default' : 'cursor-pointer'}
            `}
        >
            {/* Thumbnail */}
            <div className={`
                ${playlistCardThumbnailBaseClass}
                ${isPlaying ? playlistCardThumbnailRingClass : ''}
                bg-gradient-to-br from-zinc-700 to-zinc-800
            `}>
                {thumbnail ? (
                    <img
                        src={thumbnail}
                        alt={file.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = "none";
                        }}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <LuFilm className="text-gray-500" size={20} />
                    </div>
                )}
                
                {/* Play indicator overlay */}
                {isPlaying && (
                    <div className={playlistCardPlayingOverlayClass}>
                        <div className={playlistCardPlayingIndicatorClass}>
                            <LuPlay className="text-white ml-0.5" size={12} />
                        </div>
                    </div>
                )}
            </div>

            {/* File info */}
            <div className="flex flex-col gap-0.5 min-w-0 flex-1 justify-center overflow-hidden text-left">
                <div className="flex items-center gap-2">
                    <p className={`text-xs font-semibold line-clamp-1 leading-tight ${
                        isPlaying ? 'text-pink-400' : 'text-gray-200'
                    }`}>
                        {file.name}
                    </p>
                    {isPlaying && (
                        <span className={playlistCardPlayingBadgeClass}>
                            {t("playing")}
                        </span>
                    )}
                </div>
                <p className="text-gray-500 text-[10px] truncate">
                    {formatFileSize(file.size)} • {t("localFile")}
                </p>
            </div>

            {/* Index number */}
            <div className={`
                ${playlistCardIndexBaseClass}
                ${isPlaying
                    ? playlistCardIndexPlayingClass
                    : playlistCardIndexIdleClass
                }
            `}>
                {index + 1}
            </div>
        </button>
    );
};
