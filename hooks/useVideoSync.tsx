import { useEffect, useState, useCallback, useRef } from "react";
import type ReactPlayer from "react-player";
import { useSocket } from "@/context/SocketContext";
import { SocketEvent } from "@/types/socketEvents";
import { useDispatch } from "react-redux";
import { setSelectedFileIndex } from "@/lib/store/slices/roomSlice";
import { store } from "@/lib/store";

/**
 * useVideoSync
 * 
 * Hook for synchronizing video playback across users in a room.
 * Handles: video selection, play/pause, seek synchronization
 */

interface UseVideoSyncParams {
    playerRef: React.RefObject<ReactPlayer | null>;
    isHost: boolean;
}

type FullVideoState = {
    selectedIndex: number;
    playing: boolean;
    currentTime: number;
};

export const useVideoSync = ({ playerRef, isHost }: UseVideoSyncParams) => {
    const { socket, isConnected } = useSocket();
    const dispatch = useDispatch();
    const [isPlaying, setIsPlaying] = useState(false);
    const [roomId, setRoomId] = useState<string>();
    const [isJoined, setIsJoined] = useState(false);
    
    // Refs to avoid stale closures
    const isPlayingRef = useRef(isPlaying);
    const pendingSyncRef = useRef<FullVideoState | null>(null);
    
    useEffect(() => {
        isPlayingRef.current = isPlaying;
    }, [isPlaying]);

    // Get current full video state from host
    const getHostState = useCallback((): FullVideoState => {
        const state = store.getState();
        const currentTime = playerRef.current?.getCurrentTime?.() || 0;
        return {
            selectedIndex: state.room.selectedFileIndex,
            playing: isPlayingRef.current,
            currentTime,
        };
    }, [playerRef]);

    // Apply sync state to player
    const applySyncState = useCallback((syncState: FullVideoState, forceSeek = false) => {
        if (!playerRef.current || isHost) return;
        
        const state = store.getState();
        const currentIndex = state.room.selectedFileIndex;
        
        console.log("Applying sync state:", syncState, "current index:", currentIndex);
        
        // Update video index if needed
        if (syncState.selectedIndex !== currentIndex) {
            console.log("Changing video index to:", syncState.selectedIndex);
            pendingSyncRef.current = syncState;
            dispatch(setSelectedFileIndex(syncState.selectedIndex));
            // onReady will handle the seek after video loads
            return;
        }
        
        // Same video - apply seek and play state
        const currentTime = playerRef.current.getCurrentTime?.() || 0;
        const drift = Math.abs(currentTime - syncState.currentTime);
        
        if (drift > 1 || forceSeek) {
            console.log("Seeking to:", syncState.currentTime, "drift:", drift);
            playerRef.current.seekTo(syncState.currentTime, "seconds");
        }
        
        setIsPlaying(syncState.playing);
        pendingSyncRef.current = null;
    }, [playerRef, isHost, dispatch]);

    // Called when video is ready - apply pending sync
    const onReady = useCallback(() => {
        console.log("Video ready! Pending sync:", pendingSyncRef.current, "roomId:", roomId);
        
        if (pendingSyncRef.current && playerRef.current && !isHost) {
            // Small delay to ensure video is fully playable
            setTimeout(() => {
                if (playerRef.current && pendingSyncRef.current) {
                    console.log("Applying pending sync after ready:", pendingSyncRef.current);
                    playerRef.current.seekTo(pendingSyncRef.current.currentTime, "seconds");
                    setIsPlaying(pendingSyncRef.current.playing);
                    pendingSyncRef.current = null;
                }
            }, 800);
        } else if (!isHost && roomId && !pendingSyncRef.current) {
            // No pending sync but video is ready - request current state from host
            // This handles the case where we loaded with wrong video or missed initial sync
            console.log("Video ready but no pending sync, requesting from host...");
            socket?.emit(SocketEvent.REQUEST_CURRENT_VIDEO, { roomId });
        }
    }, [playerRef, isHost, roomId, socket]);

    // Emit play event (host only broadcasts)
    const onPlay = useCallback((event: string) => {
        if (event === 'seekend') return;
        setIsPlaying(true);
        
        if (!isJoined || !socket || !roomId) return;
        
        if (isHost) {
            const state = getHostState();
            socket.emit(SocketEvent.ONPLAY, { roomId, videoState: state });
        }
    }, [isHost, isJoined, roomId, socket, getHostState]);

    // Emit pause event (host only broadcasts)
    const onPause = useCallback((event: string) => {
        if (event === "seekend") return;
        setIsPlaying(false);
        
        if (!isJoined || !socket || !roomId) return;
        
        if (isHost) {
            const state = getHostState();
            socket.emit(SocketEvent.ONPAUSE, { roomId, videoState: state });
        }
    }, [isHost, isJoined, roomId, socket, getHostState]);

    // Emit seek event (host only broadcasts)
    const onSeeked = useCallback(() => {
        if (!isJoined || !socket || !roomId) return;
        
        if (isHost) {
            const state = getHostState();
            socket.emit(SocketEvent.ONSEEKED, { roomId, videoState: state });
        }
    }, [isHost, isJoined, roomId, socket, getHostState]);

    // Select video (host only)
    const selectVideo = useCallback((index: number) => {
        if (!isHost || !socket || !roomId) return;
        
        dispatch(setSelectedFileIndex(index));
        socket.emit(SocketEvent.SELECT_VIDEO, { roomId, selectedIndex: index });
    }, [isHost, socket, roomId, dispatch]);

    // Join room
    const joinRoom = useCallback((room: string, isHostFlag: boolean, username: string) => {
        setRoomId(room);
        setIsJoined(true);
        console.log("Joining room:", { roomId: room, host: isHostFlag, name: username });
        socket?.emit(SocketEvent.JOIN_ROOM, { roomId: room, host: isHostFlag, name: username });
        
        // Non-host: also explicitly request current state after a delay
        // This ensures we get the state even if the initial SYNCWITHHOST was missed
        if (!isHostFlag) {
            setTimeout(() => {
                console.log("Requesting current video state from host...");
                socket?.emit(SocketEvent.REQUEST_CURRENT_VIDEO, { roomId: room });
            }, 1000);
        }
    }, [socket]);

    // Socket event handlers
    useEffect(() => {
        if (!socket) return;

        // Handle play/pause/seek events from host
        const handleVideoEvent = ({ videoState }: { videoState: FullVideoState }) => {
            if (!isHost && videoState) {
                applySyncState(videoState);
            }
        };

        // Host: respond to sync request (triggered when user joins)
        const handleSyncWithHost = () => {
            if (!isHost || !playerRef.current) return;
            
            const state = getHostState();
            console.log("Host responding to sync request:", state);
            
            socket.emit(SocketEvent.HOSTVIDEOSTATE, {
                roomId: roomId ?? "room",
                videoState: state,
            });
        };

        // Non-host: receive full state from host
        const handleHostVideoState = ({ hostVideoState }: { hostVideoState: FullVideoState }) => {
            console.log("Received host video state:", hostVideoState);
            if (!isHost && hostVideoState) {
                applySyncState(hostVideoState, true);
            }
        };

        // Handle video selection from host
        const handleVideoSelected = ({ selectedIndex }: { selectedIndex: number }) => {
            if (!isHost) {
                console.log("Host selected video:", selectedIndex);
                const state = store.getState();
                if (selectedIndex !== state.room.selectedFileIndex) {
                    pendingSyncRef.current = { selectedIndex, playing: false, currentTime: 0 };
                    dispatch(setSelectedFileIndex(selectedIndex));
                }
            }
        };

        // Host: respond to current video request
        const handleRequestCurrentVideo = ({ requesterId }: { requesterId?: string }) => {
            if (!isHost || !playerRef.current) return;
            
            const state = getHostState();
            console.log("Host responding to video request:", state);
            
            socket.emit(SocketEvent.CURRENT_VIDEO_STATE, {
                roomId: roomId ?? "room",
                ...state,
                requesterId,
            });
        };

        // Non-host: receive current video state
        const handleCurrentVideoState = (data: FullVideoState & { requesterId?: string }) => {
            if (!isHost) {
                console.log("Received current video state:", data);
                applySyncState(data, true);
            }
        };

        socket.on(SocketEvent.ONPAUSE, handleVideoEvent);
        socket.on(SocketEvent.ONPLAY, handleVideoEvent);
        socket.on(SocketEvent.ONSEEKED, handleVideoEvent);
        socket.on(SocketEvent.SYNCWITHHOST, handleSyncWithHost);
        socket.on(SocketEvent.HOSTVIDEOSTATE, handleHostVideoState);
        socket.on(SocketEvent.VIDEO_SELECTED, handleVideoSelected);
        socket.on(SocketEvent.REQUEST_CURRENT_VIDEO, handleRequestCurrentVideo);
        socket.on(SocketEvent.CURRENT_VIDEO_STATE, handleCurrentVideoState);

        return () => {
            socket.off(SocketEvent.ONPAUSE, handleVideoEvent);
            socket.off(SocketEvent.ONPLAY, handleVideoEvent);
            socket.off(SocketEvent.ONSEEKED, handleVideoEvent);
            socket.off(SocketEvent.SYNCWITHHOST, handleSyncWithHost);
            socket.off(SocketEvent.HOSTVIDEOSTATE, handleHostVideoState);
            socket.off(SocketEvent.VIDEO_SELECTED, handleVideoSelected);
            socket.off(SocketEvent.REQUEST_CURRENT_VIDEO, handleRequestCurrentVideo);
            socket.off(SocketEvent.CURRENT_VIDEO_STATE, handleCurrentVideoState);
        };
    }, [socket, isHost, playerRef, roomId, getHostState, applySyncState, dispatch]);

    return { 
        socket, 
        onPlay, 
        onPause, 
        onSeeked, 
        onReady,
        isPlaying, 
        joinRoom, 
        isConnected, 
        selectVideo,
    };
};
