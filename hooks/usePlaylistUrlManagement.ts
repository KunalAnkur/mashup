import { useState, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/lib/store";
import { updateRoomInfo } from "@/lib/store/slices/roomSlice";
import { useUpdateRoomMutation, useGetRoomByRoomIdMutation } from "@/lib/store/api/roomApi";
import { useRoomContext } from "@/context/RoomContext";
import { validateUrl, normalizeUrlForPlayer } from "@/types/ModalTypes/urlUtils";

interface PlaylistItemMetadata {
    url: string;
    title?: string;
    description?: string;
    thumbnail?: string;
    author?: string;
}

export const usePlaylistUrlManagement = () => {
    const dispatch = useDispatch();
    const authState = useSelector((state: RootState) => state.auth);
    const roomState = useSelector((state: RootState) => state.room);
    const { updatePlaylist } = useRoomContext();
    const [updateRoom] = useUpdateRoomMutation();
    const [getRoomByRoomId] = useGetRoomByRoomIdMutation();

    const [isAddingUrls, setIsAddingUrls] = useState(false);
    const [urlError, setUrlError] = useState("");

    const handleAddMoreUrls = useCallback(async (
        urlInput: string,
        existingUrls: string[],
        onSuccess?: () => void
    ) => {
        const rawUrl = urlInput.trim();
        
        // Validate URL
        if (!rawUrl) {
            setUrlError("Please enter a URL");
            return;
        }
        
        const validation = validateUrl(rawUrl);
        if (!validation.valid) {
            setUrlError(validation.tooltip || "Invalid URL. Please enter a supported video URL.");
            return;
        }
        
        setIsAddingUrls(true);
        setUrlError("");
        
        try {
            // Normalize URL for player
            const url = normalizeUrlForPlayer(rawUrl);
            
            // Check if it's a YouTube Mix playlist (RD) - these should only add the first video
            let isMixPlaylist = false;
            try {
                const urlObj = new URL(rawUrl);
                const playlistId = urlObj.searchParams.get("list");
                if (playlistId && playlistId.startsWith("RD")) {
                    isMixPlaylist = true;
                }
            } catch {
                // Ignore URL parsing errors
            }
            
            // Fetch metadata (and possible playlist) from backend
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

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const message =
                    errorData?.message ||
                    errorData?.error ||
                    `Failed to fetch metadata: ${response.statusText}`;
                setUrlError(message);
                return;
            }

            const data = await response.json().catch(() => ({}));
            const serverData = data?.data || {};
            const playlistItems = serverData.playlistItems as PlaylistItemMetadata[] | undefined;

            // Determine URLs to add
            let urlsToAdd: string[] = [];
            
            if (playlistItems && playlistItems.length > 0 && !isMixPlaylist) {
                // If backend returned a playlist (and it's not a Mix), add all playlist video URLs
                urlsToAdd = playlistItems.map((item) => item.url);
                console.log(`[PlaylistUrlManagement] Adding ${playlistItems.length} videos from playlist`);
            } else {
                // Normal single URL behavior (including Mix playlists which only add the first video)
                urlsToAdd = [url];
                if (isMixPlaylist) {
                    console.log('[PlaylistUrlManagement] Mix playlist detected, adding only the first video');
                }
            }

            // Combine existing URLs with new URLs
            const newUrls = [...existingUrls, ...urlsToAdd];
            
            // Validate URLs array
            if (!Array.isArray(newUrls) || newUrls.length === 0) {
                setUrlError("Invalid URLs array. Please try again.");
                return;
            }
            
            // Filter out any invalid URLs
            const validUrls = newUrls.filter((u) => u && typeof u === 'string' && u.trim().length > 0);
            
            if (validUrls.length === 0) {
                setUrlError("No valid URLs to add. Please check your input.");
                return;
            }
            
            console.log(`[PlaylistUrlManagement] Preparing to update room with ${validUrls.length} URLs (${urlsToAdd.length} new)`);

            if (!roomState.roomId) {
                setUrlError("Room ID is missing");
                return;
            }
            
            // First, get the database UUID from room_id
            let databaseId: string;
            try {
                const roomInfo = await getRoomByRoomId(roomState.roomId).unwrap();
                databaseId = roomInfo?.data?.id;
                if (!databaseId) {
                    console.error('Room info response:', roomInfo);
                    setUrlError("Could not find database ID for room");
                    return;
                }
                console.log('[PlaylistUrlManagement] Got database ID:', databaseId);
            } catch (fetchError: any) {
                console.error('Error fetching room info:', fetchError);
                const fetchErrorMessage = 
                    fetchError?.data?.message || 
                    fetchError?.message || 
                    "Failed to fetch room information";
                setUrlError(fetchErrorMessage);
                return;
            }
            
            // Update room using database UUID
            try {
                console.log('[PlaylistUrlManagement] Updating room with URLs:', validUrls);
                const result = await updateRoom({
                    id: databaseId,
                    body: {
                        urls: validUrls,
                        type: "sync",
                        source: "url",
                    },
                }).unwrap();
                
                console.log('[PlaylistUrlManagement] Room updated successfully:', result);
                
                // Update Redux state
                dispatch(updateRoomInfo({
                    urls: validUrls,
                }));
                
                await updatePlaylist(validUrls);
                console.log(`[PlaylistUrlManagement] Added ${urlsToAdd.length} URL(s), total: ${validUrls.length}`);
                
                // Call success callback
                if (onSuccess) {
                    onSuccess();
                }
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
                console.error('Error updating room - full error object:', JSON.stringify(updateError, Object.getOwnPropertyNames(updateError), 2));
                
                setUrlError(updateErrorMessage);
            }
        } catch (error: any) {
            // Catch any unexpected errors
            console.error('Unexpected error adding URL:', error);
            const errorMessage = 
                error?.message || 
                error?.error ||
                "An unexpected error occurred. Please try again.";
            setUrlError(errorMessage);
        } finally {
            setIsAddingUrls(false);
        }
    }, [authState.token, roomState.roomId, updateRoom, dispatch, getRoomByRoomId, updatePlaylist]);

    return {
        isAddingUrls,
        urlError,
        setUrlError,
        handleAddMoreUrls,
    };
};

