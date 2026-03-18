import React from "react";
import { LuPlay, LuFilm } from "react-icons/lu";
import { AddedUrl } from "@/types/ModalTypes/addedUrlTypes";
import { getPlatformById, getUrlDisplayName } from "@/types/ModalTypes/urlUtils";
import { useTranslations } from "@/i18n/I18nProvider";
import {
    appPulseSurfaceClass,
} from "@/components/UI/classTokens";
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

interface PlaylistUrlCardProps {
    url: AddedUrl;
    index: number;
    isPlaying: boolean;
    isHost: boolean;
    isLoading?: boolean;
    onSelect: () => void;
}

export const PlaylistUrlCard: React.FC<PlaylistUrlCardProps> = ({
    url,
    index,
    isPlaying,
    isHost,
    isLoading = false,
    onSelect,
}) => {
    const t = useTranslations("panel.playlist");
    const platform = getPlatformById(url.platformId);
    const hasMetadata = url.metadata && (url.metadata.title || url.metadata.thumbnail);

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
                bg-gradient-to-br from-[#1f1f23] to-[#27272a]
            `}>
                {isLoading ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/5 animate-pulse">
                        <div className="w-5 h-5 border-2 border-white/20 border-t-white/60 rounded-full animate-spin"></div>
                    </div>
                ) : url.metadata?.thumbnail ? (
                    <img
                        src={url.metadata.thumbnail}
                        alt={url.metadata?.title || "Video thumbnail"}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = "none";
                        }}
                    />
                ) : null}
                {!isLoading && (
                    <div
                        className={`absolute inset-0 flex items-center justify-center ${
                            url.metadata?.thumbnail ? "hidden" : ""
                        } ${platform?.iconBg || "bg-gradient-to-br from-pink-500 to-fuchsia-600"}`}
                    >
                        <span className="text-white text-lg">
                            {platform?.smallIcon || <LuFilm className="text-white text-sm" />}
                        </span>
                    </div>
                )}
                
                {/* Play indicator overlay */}
                {isPlaying && !isLoading && (
                    <div className={playlistCardPlayingOverlayClass}>
                        <div className={playlistCardPlayingIndicatorClass}>
                            <LuPlay className="text-white ml-0.5" size={12} />
                        </div>
                    </div>
                )}
            </div>

            {/* Metadata */}
            <div className="flex flex-col gap-0.5 min-w-0 flex-1 justify-center overflow-hidden text-left">
                {isLoading ? (
                    <div className="space-y-1.5">
                        <div className={`h-3.5 w-3/4 ${appPulseSurfaceClass}`}></div>
                        <div className="h-2.5 bg-white/5 rounded w-1/2 animate-pulse"></div>
                    </div>
                ) : hasMetadata && url.metadata ? (
                    <>
                        <div className="flex items-center gap-2">
                            <p className={`text-xs font-semibold line-clamp-1 leading-tight ${
                                isPlaying ? 'text-pink-400' : 'text-gray-200'
                            }`}>
                                {url.metadata.title || getUrlDisplayName(url.url)}
                            </p>
                            {isPlaying && (
                                <span className={playlistCardPlayingBadgeClass}>
                                    {t("playing")}
                                </span>
                            )}
                        </div>
                        {url.metadata.description && (
                            <p className="text-gray-500 text-[10px] line-clamp-1 leading-tight">
                                {url.metadata.description}
                            </p>
                        )}
                        <div className="flex items-center gap-1.5 text-[10px] text-gray-500 mt-0.5">
                            {url.metadata.author && (
                                <span className="truncate max-w-[80px]">{url.metadata.author}</span>
                            )}
                            {url.metadata.author && platform && <span>•</span>}
                            {platform && <span className="truncate">{platform.name}</span>}
                        </div>
                    </>
                ) : (
                    <>
                        <div className="flex items-center gap-2">
                            <p className={`text-xs font-medium truncate ${
                                isPlaying ? 'text-pink-400' : 'text-gray-200'
                            }`}>
                                {getUrlDisplayName(url.url)}
                            </p>
                            {isPlaying && (
                                <span className={playlistCardPlayingBadgeClass}>
                                    {t("playing")}
                                </span>
                            )}
                        </div>
                        {platform && (
                            <p className="text-gray-500 text-[10px] truncate">{platform.name}</p>
                        )}
                    </>
                )}
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
