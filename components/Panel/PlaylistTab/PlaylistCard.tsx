"use client";
import React from "react";
import { LuPlay, LuFilm, LuX } from "react-icons/lu";
import { FaBroadcastTower } from "react-icons/fa";
import { getPlatformById, getUrlDisplayName, detectPlatform, getPlatformByLink } from "@/types/ModalTypes/urlUtils";
import { STREAMING_PLATFORMS } from "@/constants/streamingPlatforms";
import { useFileContext } from "@/context/FileContext";
import { useMediaStreamContext } from "@/context/MediaStreamContext";
import { Playlist } from "@/types/storeTypes";


interface PlaylistCardProps {
    content: Playlist;
    host: boolean;
    index: number;
    onSelect?: (id: string, source: "file" | "url" | "screen") => void;
    onStop?: (id: string, source: "file" | "url" | "screen") => void;
    isLoading?: boolean;
}

const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

const PlaylistCard: React.FC<PlaylistCardProps> = ({
    content,
    host,
    index,
    onSelect,
    onStop,
    isLoading = false,
}) => {
    const { source, selected: isPlaying, link, metadata } = content;
    const isClickable = source !== "screen" && host;
    const { files, getThumbnail } = useFileContext();
    const { screenType, stream, handleStopScreenSharing } = useMediaStreamContext();
    const handleClick = () => {
        if (isClickable && onSelect) {
            onSelect(content.id, source);
        }
    };

    // Render thumbnail based on card source
    const renderThumbnail = () => {
        if (source === "url") {
            const platform = getPlatformByLink(link);

            if (isLoading) {
                return (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/5 animate-pulse">
                        <div className="w-5 h-5 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
                    </div>
                );
            }

            if (metadata?.thumbnail) {
                return (
                    <img
                        src={metadata.thumbnail}
                        alt={metadata?.title || "Video thumbnail"}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = "none";
                        }}
                    />
                );
            }

            return (
                <div
                    className={`absolute inset-0 flex items-center justify-center ${platform?.iconBg || "bg-gradient-to-br from-pink-500 to-fuchsia-600"}`}
                >
                    <span className="text-white text-lg">
                        {platform?.smallIcon || <LuFilm className="text-white text-sm" />}
                    </span>
                </div>
            );
        }

        if (source === "screen") {
            const defaultPlatform = STREAMING_PLATFORMS.find((p) => p.url === screenType);
            return (
                <div
                    className="w-full h-full flex items-center justify-center"
                    style={defaultPlatform?.bgStyle || {}}
                >
                    <div className="text-white text-2xl">
                        {defaultPlatform?.logo || <FaBroadcastTower />}
                    </div>
                </div>
            );
        }

        if (source === "file") {
            const ext = files.find((f) => f.id === content.id);
            if (!ext) return null;
            const file = ext.file;
            const thumbnail = getThumbnail(file);
            if (thumbnail) {
                return (
                    <img
                        src={thumbnail}
                        alt={file.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = "none";
                        }}
                    />
                );
            }
            return (
                <div className="w-full h-full flex items-center justify-center">
                    <LuFilm className="text-gray-500" size={20} />
                </div>
            );
        }
    };

    // Render playing overlay
    const renderPlayingOverlay = () => {
        if (!isPlaying) return null;

        if (source === "screen") {
            return (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-1">
                        <div className="w-6 h-6 rounded-full bg-pink-500 flex items-center justify-center">
                            <FaBroadcastTower className="text-white" size={10} />
                        </div>
                        <div className="w-1 h-1 rounded-full bg-pink-500 animate-pulse" />
                    </div>
                </div>
            );
        }

        return (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <div className="w-6 h-6 rounded-full bg-pink-500 flex items-center justify-center">
                    <LuPlay className="text-white ml-0.5" size={12} />
                </div>
            </div>
        );
    };

    // Render metadata section
    const renderMetadata = () => {
        if (source === "url") {
            const platformId = link ? detectPlatform(link) : null;
            const platform = platformId ? getPlatformById(platformId) : null;
            const hasMetadata = metadata && (metadata.title || metadata.thumbnail);

            if (isLoading) {
                return (
                    <div className="space-y-1.5">
                        <div className="h-3.5 bg-white/10 rounded animate-pulse w-3/4" />
                        <div className="h-2.5 bg-white/5 rounded w-1/2 animate-pulse" />
                    </div>
                );
            }

            if (hasMetadata && metadata) {
                return (
                    <>
                        <div className="flex items-center gap-2">
                            <p
                                className={`text-xs font-semibold line-clamp-1 leading-tight ${isPlaying ? "text-pink-400" : "text-gray-200"
                                    }`}
                            >
                                {metadata.title || getUrlDisplayName(link)}
                            </p>
                            {isPlaying && (
                                <span className="flex-shrink-0 px-1.5 py-0.5 text-[10px] font-medium bg-pink-500/20 text-pink-400 rounded">
                                    Playing
                                </span>
                            )}
                        </div>
                        {metadata.description && (
                            <p className="text-gray-500 text-[10px] line-clamp-1 leading-tight">
                                {metadata.description}
                            </p>
                        )}
                        <div className="flex items-center gap-1.5 text-[10px] text-gray-500 mt-0.5">
                            {metadata.author && (
                                <span className="truncate max-w-[80px]">{metadata.author}</span>
                            )}
                            {metadata.author && platform && <span>•</span>}
                            {platform && <span className="truncate">{platform.name}</span>}
                        </div>
                    </>
                );
            }

            return (
                <>
                    <div className="flex items-center gap-2">
                        <p
                            className={`text-xs font-medium truncate ${isPlaying ? "text-pink-400" : "text-gray-200"
                                }`}
                        >
                            {getUrlDisplayName(link)}
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
            );
        }

        if (source === "screen") {
            const platformName = metadata?.title || "Screen Share";
            return (
                <>
                    <div className="flex items-center gap-2">
                        <p
                            className={`text-xs font-semibold line-clamp-1 leading-tight ${isPlaying ? "text-pink-400" : "text-gray-200"
                                }`}
                        >
                            {platformName}
                        </p>
                        {isPlaying && (
                            <span className="flex-shrink-0 px-1.5 py-0.5 text-[10px] font-medium bg-pink-500/20 text-pink-400 rounded">
                                Streaming
                            </span>
                        )}
                    </div>
                    <p className="text-gray-500 text-[10px] truncate">Screen sharing active</p>
                </>
            );
        }

        if (source === "file") {
            const ext = files.find((f) => f.id === content.id);
            if (!ext) return null;
            const file = ext.file;
            return (
                <>
                    <div className="flex items-center gap-2">
                        <p
                            className={`text-xs font-semibold line-clamp-1 leading-tight ${isPlaying ? "text-pink-400" : "text-gray-200"
                                }`}
                        >
                            {metadata?.title || link}
                        </p>
                        {isPlaying && (
                            <span className="flex-shrink-0 px-1.5 py-0.5 text-[10px] font-medium bg-pink-500/20 text-pink-400 rounded">
                                Playing
                            </span>
                        )}
                    </div>
                    <p className="text-gray-500 text-[10px] truncate">
                        {file.size ? `${formatFileSize(file.size)} • ` : ""}Local file
                    </p>
                </>
            );
        }
    };

    // Render right action (index or stop button)
    const renderRightAction = () => {
        const handleStop = (id: string, source: "file" | "url" | "screen") => {
            console.log("screen stream mediastream = [PlaylistCard] Stopping screen stream = ", stream);
            handleStopScreenSharing()
            if (onStop) {
                onStop(content.id, source);
            }
        };
        if (source === "screen" && host && onStop) {
            return (
                <button
                    onClick={() => handleStop(content.id, source)}
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 self-center bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 transition-all duration-200 group-hover:scale-110"
                    title="Stop screen sharing"
                >
                    <LuX size={12} />
                </button>
            );
        }

        if (source === "screen") {
            return (
                <div
                    className={`
            w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 self-center
            ${isPlaying ? "bg-pink-500/20 text-pink-400" : "bg-white/5 text-gray-500"}
          `}
                >
                    <FaBroadcastTower size={12} />
                </div>
            );
        }

        return (
            <div
                className={`
          w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 self-center
          ${isPlaying ? "bg-pink-500/20 text-pink-400" : "bg-white/5 text-gray-500 group-hover:bg-white/10"}
        `}
            >
                {index + 1}
            </div>
        );
    };

    const CardWrapper = isClickable ? "button" : "div";

    return (
        <CardWrapper
            onClick={handleClick}
            disabled={isClickable && !host}
            className={`
        group w-full flex gap-3 rounded-xl p-2 transition-all duration-200 h-[72px] shrink-0
        ${isPlaying
                    ? "bg-gradient-to-r from-rose-600/20 via-pink-600/20 to-fuchsia-600/20 border border-pink-500/30"
                    : "bg-white/5 border border-transparent hover:bg-white/10 hover:border-white/10"}
        ${isClickable ? "cursor-pointer" : "cursor-default"}
        ${isClickable && !host ? "cursor-default" : ""}
      `}
        >
            {/* Thumbnail */}
            <div
                className={`
          relative w-20 h-13 rounded-lg overflow-hidden shrink-0
          ${isPlaying ? "ring-2 ring-pink-500/50" : ""}
          ${source === "url" ? "bg-gradient-to-br from-[#1f1f23] to-[#27272a]" : ""}
          ${source === "file" ? "bg-gradient-to-br from-zinc-700 to-zinc-800" : ""}
        `}
            >
                {renderThumbnail()}
                {source !== "url" || !isLoading ? renderPlayingOverlay() : null}
            </div>

            {/* Metadata */}
            <div className="flex flex-col gap-0.5 min-w-0 flex-1 justify-center overflow-hidden text-left">
                {renderMetadata()}
            </div>

            {/* Right Action */}
            {renderRightAction()}
        </CardWrapper>
    );
};

export { PlaylistCard };