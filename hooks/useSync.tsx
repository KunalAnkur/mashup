import { useEffect, useState, useCallback, useRef } from "react";
import type ReactPlayer from "react-player";
import { useSocket } from "@/context/SocketContext";
import { SocketEvent } from "@/types/socketEvents";
import { useDispatch } from "react-redux";
import { setSelectedFileIndex } from "@/lib/store/slices/roomSlice";
import { store } from "@/lib/store";

interface UseSyncParams {
    playerRef: React.RefObject<ReactPlayer | null>;
    isHost: boolean;
    roomId: string | null;
    enabled?: boolean;
}

type VideoState = {
    selectedIndex: number;
    playing: boolean;
    currentTime: number;
};

export const useSync = ({ playerRef, isHost, roomId, enabled = true }: UseSyncParams) => {
    const { socket, isConnected } = useSocket();
    const dispatch = useDispatch();

    const [isPlaying, setIsPlaying] = useState(false);

    const isPlayingRef = useRef(isPlaying);
    const pendingSyncRef = useRef<VideoState | null>(null);
    const seekTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const initialSyncDoneRef = useRef(false);

    useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);

    // Reset sync state when roomId changes
    useEffect(() => {
        initialSyncDoneRef.current = false;
        pendingSyncRef.current = null;
    }, [roomId]);

    const getHostState = useCallback((): VideoState => ({
        selectedIndex: store.getState().room.selectedFileIndex,
        playing: isPlayingRef.current,
        currentTime: playerRef.current?.getCurrentTime?.() || 0,
    }), [playerRef]);

    const applySyncState = useCallback((syncState: VideoState, forceSeek = false) => {
        if (!playerRef.current || isHost || !enabled) return;

        const currentIndex = store.getState().room.selectedFileIndex;

        // Mark initial sync as done when we receive any sync state
        initialSyncDoneRef.current = true;

        // Need to change video first
        if (syncState.selectedIndex !== currentIndex) {
            pendingSyncRef.current = syncState;
            dispatch(setSelectedFileIndex(syncState.selectedIndex));
            return;
        }

        // Same video - apply time and play state
        const currentTime = playerRef.current.getCurrentTime?.() || 0;
        const drift = Math.abs(currentTime - syncState.currentTime);

        // Tighter drift threshold (0.5s) for better sync
        if (drift > 0.5 || forceSeek) {
            playerRef.current.seekTo(syncState.currentTime, "seconds");
        }

        setIsPlaying(syncState.playing);
        pendingSyncRef.current = null;
    }, [playerRef, isHost, dispatch, enabled]);

    // Video ready handler - apply pending sync or request state
    const onReady = useCallback(() => {
        if (!enabled) return;

        if (pendingSyncRef.current && playerRef.current && !isHost) {
            // Apply pending sync after video loads
            setTimeout(() => {
                if (playerRef.current && pendingSyncRef.current) {
                    playerRef.current.seekTo(pendingSyncRef.current.currentTime, "seconds");
                    setIsPlaying(pendingSyncRef.current.playing);
                    pendingSyncRef.current = null;
                }
            }, 800);
        } else if (!isHost && roomId && !pendingSyncRef.current) {
            // No pending sync - request current state from host
            // This handles cases where we missed the initial sync
            socket?.emit(SocketEvent.REQUEST_CURRENT_VIDEO, { roomId });
        }
    }, [playerRef, isHost, roomId, socket, enabled]);

    // Request initial sync when joining (non-host only)
    // This is a safety net - always fires 1 second after enabled becomes true
    useEffect(() => {
        if (!isHost && roomId && enabled && socket) {
            const timeout = setTimeout(() => {
                // Always request regardless of previous attempts
                // The host will respond and we'll sync
                socket.emit(SocketEvent.REQUEST_CURRENT_VIDEO, { roomId });
            }, 1000);

            return () => clearTimeout(timeout);
        }
    }, [isHost, roomId, enabled, socket]);

    const onPlay = useCallback((event: string) => {
        if (event === 'seekend' || !enabled) return;

        setIsPlaying(true);
        isPlayingRef.current = true;

        if (socket && roomId && isHost) {
            socket.emit(SocketEvent.ONPLAY, { roomId, videoState: getHostState() });
        }
    }, [isHost, roomId, socket, getHostState, enabled]);

    const onPause = useCallback((event: string) => {
        if (event === "seekend" || !enabled) return;

        setIsPlaying(false);
        isPlayingRef.current = false;

        if (socket && roomId && isHost) {
            socket.emit(SocketEvent.ONPAUSE, { roomId, videoState: getHostState() });
        }
    }, [isHost, roomId, socket, getHostState, enabled]);

    const onSeeked = useCallback(() => {
        if (!socket || !roomId || !isHost || !enabled) return;

        if (seekTimeoutRef.current) clearTimeout(seekTimeoutRef.current);

        const startTime = playerRef.current?.getCurrentTime?.() || 0;
        let lastTime = startTime;

        // Retry logic to get accurate seek time
        const checkTime = (attempt: number, max = 8) => {
            const state = getHostState();
            const timeChanged = Math.abs(state.currentTime - lastTime) > 0.5;

            if ((state.currentTime >= 0 && (timeChanged || attempt >= 3)) || attempt >= max) {
                if (state.currentTime > 0 || attempt >= max) {
                    socket.emit(SocketEvent.ONSEEKED, { roomId, videoState: state });
                }
                seekTimeoutRef.current = null;
            } else {
                lastTime = state.currentTime;
                seekTimeoutRef.current = setTimeout(() => checkTime(attempt + 1, max), 150);
            }
        };

        seekTimeoutRef.current = setTimeout(() => checkTime(1), 300);
    }, [isHost, roomId, socket, getHostState, playerRef, enabled]);

    const selectVideo = useCallback((index: number) => {
        if (!isHost || !socket || !roomId || !enabled) return;

        dispatch(setSelectedFileIndex(index));
        socket.emit(SocketEvent.SELECT_VIDEO, { roomId, selectedIndex: index });
    }, [isHost, socket, roomId, dispatch, enabled]);

    // Socket event handlers
    useEffect(() => {
        if (!socket || !enabled) return;

        // Handle play/pause from host (uses drift check)
        const handlePlayPause = ({ videoState }: { videoState: VideoState }) => {
            if (!isHost && videoState) applySyncState(videoState);
        };

        // Handle seek from host - always force seek for tight sync
        const handleSeeked = ({ videoState }: { videoState: VideoState }) => {
            if (!isHost && videoState) applySyncState(videoState, true);
        };

        // Host responds to sync requests (when user joins)
        const handleSyncWithHost = (data?: { roomId?: string }) => {
            if (!isHost || !playerRef.current) return;
            if (data?.roomId && data.roomId !== roomId) return;

            socket.emit(SocketEvent.HOSTVIDEOSTATE, {
                roomId: roomId ?? "room",
                videoState: getHostState(),
            });
        };

        // Non-host receives full state from host
        const handleHostVideoState = ({ hostVideoState }: { hostVideoState: VideoState }) => {
            if (!isHost && hostVideoState) applySyncState(hostVideoState, true);
        };

        // Video selection from host
        const handleVideoSelected = ({ selectedIndex }: { selectedIndex: number }) => {
            if (!isHost && selectedIndex !== store.getState().room.selectedFileIndex) {
                pendingSyncRef.current = { selectedIndex, playing: false, currentTime: 0 };
                dispatch(setSelectedFileIndex(selectedIndex));
            }
        };

        // Host responds to video state request
        const handleRequestCurrentVideo = (data?: { requesterId?: string }) => {
            if (!isHost || !playerRef.current) return;

            socket.emit(SocketEvent.CURRENT_VIDEO_STATE, {
                roomId: roomId ?? "room",
                ...getHostState(),
                requesterId: data?.requesterId,
            });
        };

        // Non-host receives current video state
        const handleCurrentVideoState = (data: VideoState) => {
            if (!isHost) applySyncState(data, true);
        };

        socket.on(SocketEvent.ONPAUSE, handlePlayPause);
        socket.on(SocketEvent.ONPLAY, handlePlayPause);
        socket.on(SocketEvent.ONSEEKED, handleSeeked);
        socket.on(SocketEvent.SYNCWITHHOST, handleSyncWithHost);
        socket.on(SocketEvent.HOSTVIDEOSTATE, handleHostVideoState);
        socket.on(SocketEvent.VIDEO_SELECTED, handleVideoSelected);
        socket.on(SocketEvent.REQUEST_CURRENT_VIDEO, handleRequestCurrentVideo);
        socket.on(SocketEvent.CURRENT_VIDEO_STATE, handleCurrentVideoState);

        return () => {
            socket.off(SocketEvent.ONPAUSE, handlePlayPause);
            socket.off(SocketEvent.ONPLAY, handlePlayPause);
            socket.off(SocketEvent.ONSEEKED, handleSeeked);
            socket.off(SocketEvent.SYNCWITHHOST, handleSyncWithHost);
            socket.off(SocketEvent.HOSTVIDEOSTATE, handleHostVideoState);
            socket.off(SocketEvent.VIDEO_SELECTED, handleVideoSelected);
            socket.off(SocketEvent.REQUEST_CURRENT_VIDEO, handleRequestCurrentVideo);
            socket.off(SocketEvent.CURRENT_VIDEO_STATE, handleCurrentVideoState);

            if (seekTimeoutRef.current) clearTimeout(seekTimeoutRef.current);
        };
    }, [socket, isHost, playerRef, roomId, getHostState, applySyncState, dispatch, enabled]);

    return { onPlay, onPause, onSeeked, onReady, isPlaying, isConnected, selectVideo };
};
