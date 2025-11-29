"use client";

import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/lib/store";
import { setUrlMetadata } from "@/lib/store/slices/roomSlice";
import { useFileContext } from "@/context/FileContext";
import { useVideoSelection } from "@/context/VideoSelectionContext";
import { LuPlay, LuFilm, LuLock, LuCrown } from "react-icons/lu";
import { AddedUrl } from "@/types/ModalTypes/addedUrlTypes";
import { detectPlatform, getPlatformById, getUrlDisplayName } from "@/types/ModalTypes/urlUtils";

// Playlist URL Card - Modified version for playing state with loading support
const PlaylistUrlCard = ({
    url,
    index,
    isPlaying,
    isHost,
    isLoading = false,
    onSelect,
}: {
    url: AddedUrl;
    index: number;
    isPlaying: boolean;
    isHost: boolean;
    isLoading?: boolean;
    onSelect: () => void;
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

// File Card for local files
const PlaylistFileCard = ({
    file,
    index,
    isPlaying,
    isHost,
    thumbnail,
    onSelect,
}: {
    file: File;
    index: number;
    isPlaying: boolean;
    isHost: boolean;
    thumbnail: string | null;
    onSelect: () => void;
}) => {
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
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <div className="w-6 h-6 rounded-full bg-pink-500 flex items-center justify-center">
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
                        <span className="flex-shrink-0 px-1.5 py-0.5 text-[10px] font-medium bg-pink-500/20 text-pink-400 rounded">
                            Playing
                        </span>
                    )}
                </div>
                <p className="text-gray-500 text-[10px] truncate">
                    {formatFileSize(file.size)} • Local file
                </p>
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

const PlaylistTab = () => {
    const dispatch = useDispatch();
    const roomState = useSelector((state: RootState) => state.room);
    const authState = useSelector((state: RootState) => state.auth);
    const { files, getThumbnail } = useFileContext();
    const { selectVideo, isHost } = useVideoSelection();

    const isFileMode = roomState.sourceType === "file";
    const urls = roomState.urls;
    const selectedIndex = roomState.selectedFileIndex;
    const urlMetadataCache = roomState.urlMetadataCache;

    // Track which URLs are currently being fetched
    const [loadingUrls, setLoadingUrls] = useState<Set<string>>(new Set());

    // Fetch metadata for URLs that aren't cached yet
    useEffect(() => {
        if (isFileMode || urls.length === 0) return;

        // Find URLs that need metadata fetching
        const urlsToFetch = urls.filter(
            (url) => !urlMetadataCache[url] && !loadingUrls.has(url)
        );

        if (urlsToFetch.length === 0) return;

        // Mark URLs as loading
        setLoadingUrls((prev) => {
            const newSet = new Set(prev);
            urlsToFetch.forEach((url) => newSet.add(url));
            return newSet;
        });

        // Fetch metadata for each URL
        const fetchMetadata = async () => {
            for (const url of urlsToFetch) {
                try {
                    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
                    const token = authState.token;

                    const response = await fetch(`${baseUrl}/api/v1/url/metadata`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            ...(token && { Authorization: `Bearer ${token}` }),
                        },
                        body: JSON.stringify({ url }),
                    });

                    if (response.ok) {
                        const data = await response.json();
                        // Cache the metadata in Redux
                        dispatch(setUrlMetadata({
                            url,
                            metadata: {
                                title: data.data?.title || undefined,
                                description: data.data?.description || undefined,
                                thumbnail: data.data?.thumbnail || undefined,
                                author: data.data?.author || data.data?.siteName || undefined,
                            },
                        }));
                    }
                } catch (error) {
                    console.error("Error fetching metadata for URL:", url, error);
                }

                // Remove from loading set
                setLoadingUrls((prev) => {
                    const newSet = new Set(prev);
                    newSet.delete(url);
                    return newSet;
                });
            }
        };

        fetchMetadata();
    }, [urls, isFileMode, authState.token, urlMetadataCache, loadingUrls, dispatch]);

    // Build URL data with cached metadata
    const getUrlData = (url: string): AddedUrl => ({
        url,
        platformId: detectPlatform(url),
        metadata: urlMetadataCache[url],
    });

    // Check if a URL is loading
    const isUrlLoading = (url: string): boolean => loadingUrls.has(url);

    // Handle video selection (only host can select)
    const handleSelectVideo = (index: number) => {
        if (!isHost) return;
        selectVideo(index);
    };

    // Get playlist items
    const getPlaylistItems = () => {
        if (isFileMode) {
            return files.map((_, index) => index);
        }
        return urls.map((_, index) => index);
    };

    const playlistItems = getPlaylistItems();

    // Empty state
    if (playlistItems.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
                <div className="p-4 rounded-2xl bg-white/5 mb-4">
                    <LuFilm className="text-gray-500" size={32} />
                </div>
                <h3 className="text-white font-semibold mb-2">No videos</h3>
                <p className="text-gray-500 text-sm">
                    {isFileMode
                        ? "No video files have been added to this party yet."
                        : "No video URLs have been added to this party yet."
                    }
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex items-center gap-2">
                    <h3 className="text-white font-semibold text-sm">
                        Playlist
                    </h3>
                    <span className="text-gray-500 text-xs">
                        ({playlistItems.length} {playlistItems.length === 1 ? 'video' : 'videos'})
                    </span>
                </div>
                {!isHost && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <LuLock size={12} />
                        <span>Host controls</span>
                    </div>
                )}
            </div>

            {/* Video List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {playlistItems.map((index) => {
                    const isPlaying = selectedIndex === index;

                    if (isFileMode) {
                        const file = files[index];
                        if (!file) return null;
                        
                        const thumbnail = getThumbnail(file);
                        
                        return (
                            <PlaylistFileCard
                                key={index}
                                file={file}
                                index={index}
                                isPlaying={isPlaying}
                                isHost={isHost}
                                thumbnail={thumbnail}
                                onSelect={() => handleSelectVideo(index)}
                            />
                        );
                    }

                    // URL mode - use cached metadata
                    const url = urls[index];
                    const urlData = getUrlData(url);
                    const isLoading = isUrlLoading(url);
                    
                    return (
                        <PlaylistUrlCard
                            key={index}
                            url={urlData}
                            index={index}
                            isPlaying={isPlaying}
                            isHost={isHost}
                            isLoading={isLoading}
                            onSelect={() => handleSelectVideo(index)}
                        />
                    );
                })}
            </div>

            {/* Host indicator */}
            {isHost && (
                <div className="mt-4 pt-4 border-t border-white/5">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <LuCrown className="text-amber-500" size={14} />
                        <span>You're the host. Click a video to switch.</span>
                    </div>
                </div>
            )}
        </div>
    );
};

// Helper function to format file size
function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export default PlaylistTab;
