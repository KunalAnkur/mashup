import React from "react";
import { LuPlay, LuFilm } from "react-icons/lu";
import { AddedUrl } from "@/types/ModalTypes/addedUrlTypes";
import { getPlatformById, getUrlDisplayName } from "@/types/ModalTypes/urlUtils";

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
    const platform = getPlatformById(url.platformId);
    const hasMetadata = url.metadata && (url.metadata.title || url.metadata.thumbnail);

    return (
        <button
            onClick={onSelect}
            disabled={!isHost}
            className={`
                group w-full flex gap-3 rounded-xl p-2 transition-all duration-200 h-[72px] shrink-0
                ${isPlaying
                    ? 'bg-gradient-to-r from-rose-600/20 via-pink-600/20 to-fuchsia-600/20 border border-pink-500/30'
                    : 'bg-white/5 border border-transparent hover:bg-white/10 hover:border-white/10'
                }
                ${!isHost ? 'cursor-default' : 'cursor-pointer'}
            `}
        >
            {/* Thumbnail */}
            <div className={`
                relative w-20 h-13 rounded-lg overflow-hidden shrink-0 
                ${isPlaying ? 'ring-2 ring-pink-500/50' : ''}
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
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <div className="w-6 h-6 rounded-full bg-pink-500 flex items-center justify-center">
                            <LuPlay className="text-white ml-0.5" size={12} />
                        </div>
                    </div>
                )}
            </div>

            {/* Metadata */}
            <div className="flex flex-col gap-0.5 min-w-0 flex-1 justify-center overflow-hidden text-left">
                {isLoading ? (
                    <div className="space-y-1.5">
                        <div className="h-3.5 bg-white/10 rounded animate-pulse w-3/4"></div>
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
                                <span className="flex-shrink-0 px-1.5 py-0.5 text-[10px] font-medium bg-pink-500/20 text-pink-400 rounded">
                                    Playing
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
                                <span className="flex-shrink-0 px-1.5 py-0.5 text-[10px] font-medium bg-pink-500/20 text-pink-400 rounded">
                                    Playing
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
                w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 self-center
                ${isPlaying
                    ? 'bg-pink-500/20 text-pink-400'
                    : 'bg-white/5 text-gray-500 group-hover:bg-white/10'
                }
            `}>
                {index + 1}
            </div>
        </button>
    );
};

