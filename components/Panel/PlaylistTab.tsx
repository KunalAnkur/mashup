"use client";

import React, { useState, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/lib/store";
import { updateRoomInfo, setSelectedFileIndex } from "@/lib/store/slices/roomSlice";
import { useFileContext } from "@/context/FileContext";
import { useVideoSelection } from "@/context/VideoSelectionContext";
import { useMediaStreamContext } from "@/context/MediaStreamContext";
import { helper } from "@/utils";
import { LuLock, LuCrown, LuPlus, LuShare2 } from "react-icons/lu";
import { AddedUrl } from "@/types/ModalTypes/addedUrlTypes";
import { detectPlatform } from "@/types/ModalTypes/urlUtils";
import { STREAMING_PLATFORMS } from "@/constants/streamingPlatforms";
import { PlaylistUrlCard, PlaylistScreenShareCard, PlaylistFileCard } from "./PlaylistCards";
import { AddUrlModal } from "./AddUrlModal";
import { PlaylistEmptyState } from "./PlaylistEmptyState";
import { usePlaylistMetadata } from "@/hooks/usePlaylistMetadata";
import { useUrlManagement } from "@/hooks/ModalHooks/useUrlManagement";
import { useUpdateRoomMutation, useGetRoomByRoomIdMutation } from "@/lib/store/api/roomApi";
import { useRoomContext } from "@/context/RoomContext";

const PlaylistTab = () => {
    const dispatch = useDispatch();
    const roomState = useSelector((state: RootState) => state.room);
    const { files, getThumbnail, requestFilePicker, setFiles, isPersistenceSupported, showPermissionPrompt } = useFileContext();
    const { selectVideo, isHost } = useVideoSelection();
    const { stream: screenStream, screenType, setStream: setScreenStream, setScreenType } = useMediaStreamContext();
    
    const [isSharingScreen, setIsSharingScreen] = useState(false);
    const [isAddingFiles, setIsAddingFiles] = useState(false);
    const [showAddUrlModal, setShowAddUrlModal] = useState(false);

    // Determine streaming mode from room state only
    const isFileStreaming = roomState.type === "stream" && roomState.source === "file";
    const isScreenSharing = roomState.type === "stream" && roomState.source === "stream";
    const isSyncMode = roomState.type === "sync" && roomState.source === "url";
    const urls = roomState.urls;
    const selectedIndex = roomState.selectedFileIndex;
    const urlMetadataCache = roomState.urlMetadataCache;

    // RTK Query hooks for room updates
    const [updateRoom] = useUpdateRoomMutation();
    const [getRoomByRoomId] = useGetRoomByRoomIdMutation();
    const { updatePlaylist } = useRoomContext();

    // Callback to handle adding URLs to room (API-based flow)
    const handleUrlAdded = useCallback(async (urlsToAdd: string[]) => {
        if (!roomState.roomId) {
            throw new Error("Room ID is missing");
        }

        // First, get the database UUID from room_id
        let databaseId: string;
        try {
            const roomInfo = await getRoomByRoomId(roomState.roomId).unwrap();
            databaseId = roomInfo?.data?.id;
            if (!databaseId) {
                console.error('Room info response:', roomInfo);
                throw new Error("Could not find database ID for room");
            }
        } catch (fetchError: any) {
            console.error('Error fetching room info:', fetchError);
            const fetchErrorMessage = 
                fetchError?.data?.message || 
                fetchError?.message || 
                "Failed to fetch room information";
            throw new Error(fetchErrorMessage);
        }

        // Combine existing URLs with new URLs
        const newUrls = [...urls, ...urlsToAdd];
        
        // Validate URLs array
        if (!Array.isArray(newUrls) || newUrls.length === 0) {
            throw new Error("Invalid URLs array. Please try again.");
        }
        
        // Filter out any invalid URLs
        const validUrls = newUrls.filter((u) => u && typeof u === 'string' && u.trim().length > 0);
        
        if (validUrls.length === 0) {
            throw new Error("No valid URLs to add. Please check your input.");
        }

        // Update room using database UUID
        try {
            await updateRoom({
                id: databaseId,
                body: {
                    urls: validUrls,
                    type: "sync",
                    source: "url",
                },
            }).unwrap();

            // Update Redux state
            dispatch(updateRoomInfo({
                urls: validUrls,
            }));

            await updatePlaylist(validUrls);
        } catch (updateError: any) {
            // RTK Query errors can have different structures
            console.error('Error updating room - raw error:', updateError);
            
            // Try to extract error message from various possible structures
            let updateErrorMessage = "Failed to update room. Please try again.";
            
            // Check for RTK Query serialized error structure
            if (updateError?.data) {
                const errorData = updateError.data;
                if (typeof errorData === 'string') {
                    updateErrorMessage = errorData;
                } else if (errorData?.message) {
                    updateErrorMessage = errorData.message;
                } else if (errorData?.error) {
                    updateErrorMessage = errorData.error;
                } else if (errorData?.errors && Array.isArray(errorData.errors)) {
                    // Joi validation errors
                    updateErrorMessage = errorData.errors.map((e: any) => e.message || e).join(', ');
                }
            } 
            // Check for serialized error (RTK Query format)
            else if (updateError?.status === 'FETCH_ERROR' || updateError?.status === 'PARSING_ERROR' || updateError?.status === 'CUSTOM_ERROR') {
                updateErrorMessage = updateError.error || updateError.message || "Network error. Please check your connection.";
            }
            // Check for standard error properties
            else if (updateError?.message) {
                updateErrorMessage = updateError.message;
            } else if (updateError?.error) {
                updateErrorMessage = updateError.error;
            } else if (typeof updateError === 'string') {
                updateErrorMessage = updateError;
            }
            
            console.error('Error updating room - extracted message:', updateErrorMessage);
            throw new Error(updateErrorMessage);
        }
    }, [roomState.roomId, urls, getRoomByRoomId, updateRoom, dispatch, updatePlaylist]);

    // Use enhanced useUrlManagement hook with API callback
    const {
        sourceUrlInput: urlInput,
        setSourceUrlInput: setUrlInput,
        isAdding: isAddingUrls,
        urlError,
        setUrlError,
        handleAddUrl: handleAddMoreUrls,
    } = useUrlManagement({
        onUrlAdded: handleUrlAdded,
        persistToLocalStorage: false, // Don't persist when using API flow
    });

    // Use custom hooks
    const { isUrlLoading } = usePlaylistMetadata(urls, isFileStreaming);

    // Find the platform being streamed
    const getStreamingPlatform = () => {
        if (!isScreenSharing) return null;
        return STREAMING_PLATFORMS.find(p => p.url === screenType);
    };

    const streamingPlatform = getStreamingPlatform();

    // Build URL data with cached metadata
    const getUrlData = (url: string): AddedUrl => ({
        url,
        platformId: detectPlatform(url),
        metadata: urlMetadataCache[url],
    });

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
                source: "file",
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

    // Handle opening add URL modal
    const handleOpenAddUrlModal = useCallback(() => {
        if (!isHost || !isSyncMode || !roomState.roomId) return;
        setShowAddUrlModal(true);
        setUrlInput("");
        setUrlError("");
    }, [isHost, isSyncMode, roomState.roomId, setUrlInput, setUrlError]);

    // Handle closing add URL modal
    const handleCloseAddUrlModal = useCallback(() => {
        setShowAddUrlModal(false);
        setUrlInput("");
        setUrlError("");
    }, [setUrlInput, setUrlError]);

    // Handle URL input change
    const handleUrlInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setUrlInput(e.target.value);
        setUrlError(""); // Clear error on input change
    }, [setUrlInput, setUrlError]);

    // Handle add more URLs (for sync mode) - wraps handleAddUrl to close modal on success
    const handleAddMoreUrlsWithClose = useCallback(async () => {
        try {
            await handleAddMoreUrls();
            // Close modal on success
            handleCloseAddUrlModal();
        } catch (error) {
            // Error is already handled by useUrlManagement
            console.error("Error adding URLs:", error);
        }
    }, [handleAddMoreUrls, handleCloseAddUrlModal]);

    // Handle URL input keydown
    const handleUrlInputKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && !urlError && urlInput.trim()) {
            handleAddMoreUrlsWithClose();
        } else if (e.key === "Escape") {
            handleCloseAddUrlModal();
        }
    }, [urlInput, urlError, handleAddMoreUrlsWithClose, handleCloseAddUrlModal]);

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
        return <PlaylistEmptyState isFileStreaming={isFileStreaming} />;
    }

    return (
        <>
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
                                onClick={handleOpenAddUrlModal}
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

            {/* Add URL Modal */}
            <AddUrlModal
                isOpen={showAddUrlModal}
                urlInput={urlInput}
                urlError={urlError}
                isAdding={isAddingUrls}
                onClose={handleCloseAddUrlModal}
                onUrlInputChange={handleUrlInputChange}
                onUrlInputKeyDown={handleUrlInputKeyDown}
                onAddUrl={handleAddMoreUrlsWithClose}
            />
        </>
    );
};

export default PlaylistTab;
