"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/lib/store";
import { setUrlMetadata, updateRoomInfo, setSelectedFileIndex } from "@/lib/store/slices/roomSlice";
import { useFileContext } from "@/context/FileContext";
import { useVideoSelection } from "@/context/VideoSelectionContext";
import { useMediaStreamContext } from "@/context/MediaStreamContext";
import { helper } from "@/utils";
import { LuPlay, LuFilm, LuLock, LuCrown, LuPlus, LuShare2, LuX } from "react-icons/lu";
import { FaBroadcastTower } from "react-icons/fa";
import { AddedUrl } from "@/types/ModalTypes/addedUrlTypes";
import { detectPlatform, getPlatformById, getUrlDisplayName, validateUrl } from "@/types/ModalTypes/urlUtils";
import { STREAMING_PLATFORMS } from "@/constants/streamingPlatforms";
import { useUpdateRoomMutation, useGetRoomByRoomIdMutation } from "@/lib/store/api/roomApi";
import { useSocket } from "@/context/SocketContext";
import { SocketEvent } from "@/types/socketEvents";

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

// Screen Share Card - Shows platform that's being streamed
const PlaylistScreenShareCard = ({
    platformName,
    platformLogo,
    platformBgStyle,
    isPlaying,
    onStop,
    isHost,
}: {
    platformName: string;
    platformLogo: React.ReactNode;
    platformBgStyle: React.CSSProperties;
    isPlaying: boolean;
    onStop?: () => void;
    isHost: boolean;
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
                            Streaming
                        </span>
                    )}
                </div>
                <p className="text-gray-500 text-[10px] truncate">
                    Screen sharing active
                </p>
            </div>

            {/* Stop button or Streaming icon */}
            {isHost && onStop ? (
                <button
                    onClick={onStop}
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 self-center bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 transition-all duration-200 group-hover:scale-110"
                    title="Stop screen sharing"
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
    const { files, getThumbnail, requestFilePicker, setFiles, isPersistenceSupported, showPermissionPrompt } = useFileContext();
    const { selectVideo, isHost } = useVideoSelection();
    const { stream: screenStream, screenType, setStream: setScreenStream, setScreenType } = useMediaStreamContext();
    const [isSharingScreen, setIsSharingScreen] = useState(false);
    const [isAddingFiles, setIsAddingFiles] = useState(false);
    const [isAddingUrls, setIsAddingUrls] = useState(false);
    const { socket } = useSocket();
    const [updateRoom] = useUpdateRoomMutation();
    const [getRoomByRoomId] = useGetRoomByRoomIdMutation();

    // Determine streaming mode from room state only
    const isFileStreaming = roomState.type === "stream" && roomState.source === "file";
    const isScreenSharing = roomState.type === "stream" && roomState.source === "stream";
    const isSyncMode = roomState.type === "sync" && roomState.source === "url";
    const urls = roomState.urls;
    const selectedIndex = roomState.selectedFileIndex;
    const urlMetadataCache = roomState.urlMetadataCache;

    // Find the platform being streamed
    const getStreamingPlatform = () => {
        if (!isScreenSharing) return null;
        
        // The first URL should be the platform URL
        // const name = screenType || "Screen Sharing";
        return STREAMING_PLATFORMS.find(p => p.url === screenType);
    };

    const streamingPlatform = getStreamingPlatform();

    // Track which URLs are currently being fetched
    const [loadingUrls, setLoadingUrls] = useState<Set<string>>(new Set());
    // Track failed URLs to prevent retries
    const failedUrlsRef = useRef<Set<string>>(new Set());

    // Fetch metadata for URLs that aren't cached yet
    useEffect(() => {
        if (isFileStreaming || urls.length === 0) return;

        // Find URLs that need metadata fetching (not cached, not loading, not failed)
        const urlsToFetch = urls.filter(
            (url) => !urlMetadataCache[url] && !loadingUrls.has(url) && !failedUrlsRef.current.has(url)
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
            console.log("[PlaylistTab] Fetching metadata for URLs:", urlsToFetch);
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
                        // Remove from failed set if it was there (in case of manual retry)
                        failedUrlsRef.current.delete(url);
                    } else {
                        // Mark as failed if response is not OK
                        console.warn(`[PlaylistTab] Failed to fetch metadata for ${url}: ${response.status}`);
                        failedUrlsRef.current.add(url);
                    }
                } catch (error) {
                    console.error("Error fetching metadata for URL:", url, error);
                    // Mark as failed on error to prevent retries
                    failedUrlsRef.current.add(url);
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
    }, [urls, isFileStreaming, authState.token, urlMetadataCache, loadingUrls, dispatch]);

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

    // Handle stop screen sharing
    const handleStopScreenSharing = useCallback(() => {
        if (!isHost || !isScreenSharing) return;
        
        // Stop all tracks in the screen stream
        if (screenStream) {
            screenStream.getTracks().forEach(track => {
                track.stop();
            });
            setScreenStream(null);
        }

        // Update room source from "stream" to "file" if files exist, otherwise keep as is
        // The card will be removed because isScreenSharing will become false
        if (files.length > 0) {
            // Switch to file mode if files exist
            dispatch(updateRoomInfo({
                source: "file",
            }));
            // Select first file
            dispatch(setSelectedFileIndex(0));
            selectVideo(0);
        } else {
            // No files, just update source to clear screen sharing
            dispatch(updateRoomInfo({
                source: "file", // or we could use "url" but file seems safer
            }));
        }
        
        console.log("[PlaylistTab] Screen sharing stopped");
    }, [isHost, isScreenSharing, screenStream, setScreenStream, files, dispatch, selectVideo]);

    // Handle share screen again (for stream source)
    const handleShareScreenAgain = useCallback(async () => {
        if (!isHost || !isScreenSharing) return;
        
        setIsSharingScreen(true);
        try {
            // Stop existing stream if any
            if (screenStream) {
                screenStream.getTracks().forEach(track => track.stop());
                setScreenStream(null);
            }

            // Use the cross-browser helper function to capture tab stream
            const {mediaStream, screenType } = await helper.captureTabStream({
                audioOnly: false,
                preferredDisplaySurface: 'tab'
            });

            if (!mediaStream) {
                // User cancelled or capture failed - silently handle
                return;
            }

            // Store in MediaStreamContext - this will replace the old stream
            setScreenStream(mediaStream);
            setScreenType(screenType);
            console.log("[PlaylistTab] Screen sharing replaced with new stream");
        } catch (err: any) {
            // Only show alert for unexpected errors, not user cancellations
            if (err.name === 'NotAllowedError' || err.name === 'AbortError') {
                // User cancelled or permission denied - silently handle
                console.log("Screen sharing cancelled or permission denied");
                return;
            }
            
            // For other errors, log but don't show alert
            console.error("Screen sharing error:", err);
            if (err.name !== 'NotFoundError' && err.name !== 'NotReadableError') {
                alert("Screen sharing failed. Please try again.");
            }
        } finally {
            setIsSharingScreen(false);
        }
    }, [isHost, isScreenSharing, screenStream, setScreenStream, setScreenType]);

    // Handle add more files (for file source)
    const handleAddMoreFiles = useCallback(async () => {
        if (!isHost || !isFileStreaming) return;
        
        setIsAddingFiles(true);
        try {
            if (isPersistenceSupported) {
                // Use File System Access API for persistence (same as stream page)
                const newFiles = await requestFilePicker(true); // true = append mode
                
                if (newFiles.length > 0) {
                    // Combine existing files with new files
                    const combinedFiles = [...files, ...newFiles];
                    // Use setFiles to update state (it will handle persistence via filesFromAPIRef)
                    await setFiles(combinedFiles);
                    console.log(`[PlaylistTab] Added ${newFiles.length} new file(s), total: ${combinedFiles.length}`);
                }
            } else {
                // Fallback: use traditional file input
                showPermissionPrompt();
                const input = document.createElement('input');
                input.type = 'file';
                input.multiple = true;
                input.accept = 'video/*';
                
                input.onchange = async (e) => {
                    try {
                        const target = e.target as HTMLInputElement;
                        const newFiles = target.files ? Array.from(target.files) : [];
                        
                        if (newFiles.length > 0) {
                            // Combine existing files with new files
                            const combinedFiles = [...files, ...newFiles];
                            await setFiles(combinedFiles);
                            console.log(`[PlaylistTab] Added ${newFiles.length} new file(s), total: ${combinedFiles.length}`);
                        }
                    } catch (error) {
                        console.error('Error adding files:', error);
                        alert("Failed to add files. Please try again.");
                    } finally {
                        setIsAddingFiles(false);
                        input.remove();
                    }
                };
                
                input.oncancel = () => {
                    setIsAddingFiles(false);
                    input.remove();
                };
                
                input.click();
            }
        } catch (error: any) {
            if (error.name === 'AbortError') {
                // User cancelled, do nothing
                return;
            }
            console.error('Error adding files:', error);
            alert("Failed to add files. Please try again.");
        } finally {
            setIsAddingFiles(false);
        }
    }, [isHost, isFileStreaming, isPersistenceSupported, files, requestFilePicker, setFiles, showPermissionPrompt]);

    // Handle add more URLs (for sync mode)
    const handleAddMoreUrls = useCallback(async () => {
        if (!isHost || !isSyncMode || !roomState.roomId) return;
        
        setIsAddingUrls(true);
        try {
            // Prompt user for URL
            const urlInput = prompt("Enter a video URL to add to the playlist:");
            
            if (!urlInput || !urlInput.trim()) {
                // User cancelled or empty input
                return;
            }
            
            const url = urlInput.trim();
            
            // Validate URL
            const validation = validateUrl(url);
            if (!validation.valid) {
                alert(validation.tooltip || "Invalid URL. Please enter a supported video URL.");
                return;
            }
            
            // Check if URL already exists
            if (urls.includes(url)) {
                alert("This URL is already in the playlist.");
                return;
            }
            
            // Combine existing URLs with new URL
            const newUrls = [...urls, url];
            
            // Update room via API
            try {
                if (!roomState.roomId) {
                    throw new Error("Room ID is missing");
                }
                
                // First, get the database UUID from room_id
                let databaseId: string;
                try {
                    const roomInfo = await getRoomByRoomId(roomState.roomId).unwrap();
                    // The response structure: { success: true, data: { id: "...", ... } }
                    databaseId = roomInfo?.data?.id;
                    if (!databaseId) {
                        console.error('Room info response:', roomInfo);
                        throw new Error("Could not find database ID for room");
                    }
                    console.log('[PlaylistTab] Got database ID:', databaseId);
                } catch (fetchError: any) {
                    console.error('Error fetching room info:', fetchError);
                    const fetchErrorMessage = fetchError?.data?.message || fetchError?.message || "Failed to fetch room information";
                    throw new Error(fetchErrorMessage);
                }
                
                // Update room using database UUID
                const result = await updateRoom({
                    id: databaseId,
                    body: {
                        urls: newUrls,
                        type: "sync",
                        source: "url",
                    },
                }).unwrap();
                
                console.log('[PlaylistTab] Room updated successfully:', result);
                
                // Update Redux state
                dispatch(updateRoomInfo({
                    urls: newUrls,
                }));
                
                // Emit socket event to notify other users
                if (socket && roomState.roomId) {
                    socket.emit(SocketEvent.ROOM_INFO_UPDATED, {
                        roomId: roomState.roomId,
                        room: {
                            urls: newUrls,
                            files: roomState.files || [],
                            selectedFileIndex: roomState.selectedFileIndex || 0,
                            source: "url",
                            type: "sync",
                        },
                    });
                }
                
                console.log(`[PlaylistTab] Added new URL, total: ${newUrls.length}`);
            } catch (error: any) {
                // RTK Query errors have a specific structure
                const errorData = error?.data || error;
                const errorMessage = errorData?.message || error?.message || error?.error || "Failed to add URL. Please try again.";
                const errorStatus = error?.status || errorData?.statusCode;
                
                console.error('Error adding URL to room:', error);
                console.error('Error details:', {
                    message: errorMessage,
                    status: errorStatus,
                    statusText: error?.statusText,
                    data: errorData,
                    originalError: error,
                    roomId: roomState.roomId,
                });
                
                alert(errorMessage);
            }
        } catch (error: any) {
            if (error.name === 'AbortError') {
                // User cancelled, do nothing
                return;
            }
            console.error('Error adding URLs:', error);
            alert("Failed to add URL. Please try again.");
        } finally {
            setIsAddingUrls(false);
        }
    }, [isHost, isSyncMode, roomState.roomId, roomState.files, roomState.selectedFileIndex, urls, updateRoom, dispatch, socket]);

    // Get playlist items
    const getPlaylistItems = () => {
        if (isFileStreaming) {
            return files.map((_, index) => index);
        }
        // For screen sharing, we show the platform card instead of URL cards
        if (isScreenSharing) {
            return []; // Return empty, we'll show screen share card separately
        }
        // For sync mode, show URLs
        return urls.map((_, index) => index);
    };

    const playlistItems = getPlaylistItems();

    // Empty state (only show if not screen sharing)
    if (playlistItems.length === 0 && !isScreenSharing) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
                <div className="p-4 rounded-2xl bg-white/5 mb-4">
                    <LuFilm className="text-gray-500" size={32} />
                </div>
                <h3 className="text-white font-semibold mb-2">No videos</h3>
                <p className="text-gray-500 text-sm">
                    {isFileStreaming
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
                        {isScreenSharing 
                            ? "(Screen sharing)"
                            : `(${playlistItems.length} ${playlistItems.length === 1 ? 'video' : 'videos'})`
                        }
                        {isScreenSharing && playlistItems.length >= 1 && `(Screen sharing) & (${playlistItems.length} ${playlistItems.length === 1 ? 'video' : 'videos'})`}
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
                {/* Screen Share Card - Show at top if screen sharing is active */}
                {isScreenSharing && streamingPlatform && (
                    <PlaylistScreenShareCard
                        platformName={streamingPlatform.name}
                        platformLogo={streamingPlatform.logo}
                        platformBgStyle={streamingPlatform.bgStyle}
                        isPlaying={true}
                        onStop={handleStopScreenSharing}
                        isHost={isHost}
                    />
                )}

                {/* Regular playlist items */}
                {playlistItems.map((index) => {
                    const isPlaying = selectedIndex === index;

                    if (isFileStreaming) {
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

            {/* Action Button - Only show for host */}
            {isHost && (isScreenSharing || isFileStreaming || isSyncMode) && (
                <div className="mt-4 pt-4 border-t border-white/5">
                    {isScreenSharing ? (
                        <button
                            onClick={handleShareScreenAgain}
                            disabled={isSharingScreen}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-rose-600/20 to-pink-600/20 hover:from-rose-600/30 hover:to-pink-600/30 border border-pink-500/30 hover:border-pink-500/50 text-pink-400 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSharingScreen ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-pink-400/30 border-t-pink-400 rounded-full animate-spin"></div>
                                    <span className="text-sm font-medium">Sharing...</span>
                                </>
                            ) : (
                                <>
                                    <LuShare2 size={16} />
                                    <span className="text-sm font-medium">Share Screen Again</span>
                                </>
                            )}
                        </button>
                    ) : isFileStreaming ? (
                        <button
                            onClick={handleAddMoreFiles}
                            disabled={isAddingFiles}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-rose-600/20 to-pink-600/20 hover:from-rose-600/30 hover:to-pink-600/30 border border-pink-500/30 hover:border-pink-500/50 text-pink-400 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isAddingFiles ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-pink-400/30 border-t-pink-400 rounded-full animate-spin"></div>
                                    <span className="text-sm font-medium">Adding...</span>
                                </>
                            ) : (
                                <>
                                    <LuPlus size={16} />
                                    <span className="text-sm font-medium">Add More Files</span>
                                </>
                            )}
                        </button>
                    ) : isSyncMode ? (
                        <button
                            onClick={handleAddMoreUrls}
                            disabled={isAddingUrls}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-rose-600/20 to-pink-600/20 hover:from-rose-600/30 hover:to-pink-600/30 border border-pink-500/30 hover:border-pink-500/50 text-pink-400 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isAddingUrls ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-pink-400/30 border-t-pink-400 rounded-full animate-spin"></div>
                                    <span className="text-sm font-medium">Adding...</span>
                                </>
                            ) : (
                                <>
                                    <LuPlus size={16} />
                                    <span className="text-sm font-medium">Add More URLs</span>
                                </>
                            )}
                        </button>
                    ) : null}
                </div>
            )}

            {/* Host indicator */}
            {isHost && !isScreenSharing && !isFileStreaming && (
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
