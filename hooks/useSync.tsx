import { useEffect, useState, useCallback, useRef } from "react";
import type ReactPlayer from "react-player";
import { useSocket } from "@/context/SocketContext";
import { SocketEvent } from "@/types/socketEvents";
import { useDispatch } from "react-redux";
import { setHostPlaybackPlaying, updateRoomInfo } from "@/lib/store/slices/roomSlice";
import { store } from "@/lib/store";
import type { RootState } from "@/lib/store";
import { trackVideoStarted, trackSyncStarted } from "@/lib/analytics";

interface UseSyncParams {
    playerRef: React.RefObject<ReactPlayer | null>;
    isHost: boolean;
    roomId: string | null;
    enabled?: boolean;
    initialPlaying: boolean;
}

// Video sync state indexed into playlist
interface VideoState {
    selectedIndex: number;
    playing: boolean;
    currentTime: number;
}

// Helpers to work with playlist in Redux
const getSelectedPlaylistIndex = (state: RootState): number => {
    const playlist = state.room.playlist || [];
    if (!playlist.length) return 0;
    const idx = playlist.findIndex((item) => item.selected);
    return idx === -1 ? 0 : idx;
};

const buildPlaylistWithSelectedIndex = (state: RootState, index: number) => {
    const playlist = state.room.playlist || [];
    return playlist.map((item, idx) => ({
        ...item,
        selected: idx === index,
    }));
};

export const useSync = ({ playerRef, isHost, roomId, initialPlaying, enabled = true }: UseSyncParams) => {
    const { socket, isConnected } = useSocket();
    const dispatch = useDispatch();

    const [isPlaying, setIsPlaying] = useState(initialPlaying);

    const isPlayingRef = useRef(isPlaying);
    const pendingSyncRef = useRef<VideoState | null>(null);
    const seekTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const initialSyncDoneRef = useRef(false);
    const isApplyingRemoteStateRef = useRef(false);
    const videoStartedTrackedRef = useRef(false); // Track if video_started was already tracked
    const syncStartedTrackedRef = useRef(false); // Track if sync_started was already tracked

    useEffect(() => {
        isPlayingRef.current = isPlaying;
    }, [isPlaying]);

    // Reset sync state when roomId changes
    useEffect(() => {
        initialSyncDoneRef.current = false;
        pendingSyncRef.current = null;
        videoStartedTrackedRef.current = false;
        syncStartedTrackedRef.current = false;
    }, [roomId]);

    // Build host state from Redux + player
    const getHostState = useCallback((): VideoState => {
        const state = store.getState() as RootState;
        const currentTime = playerRef.current?.getCurrentTime?.() || 0;
        return {
            selectedIndex: getSelectedPlaylistIndex(state),
            playing: isPlayingRef.current,
            currentTime,
        };
    }, [playerRef]);

    // Apply sync state to non-host player
    const applySyncState = useCallback(
        (syncState: VideoState, forceSeek = false) => {
            if (!playerRef.current || isHost || !enabled) return;

            const state = store.getState() as RootState;
            const currentIndex = getSelectedPlaylistIndex(state);

            // Mark initial sync as done when we receive any sync state
            initialSyncDoneRef.current = true;

            // Need to change video first
            if (syncState.selectedIndex !== currentIndex) {
                pendingSyncRef.current = syncState;
                const nextPlaylist = buildPlaylistWithSelectedIndex(state, syncState.selectedIndex);
                dispatch(updateRoomInfo({ playlist: nextPlaylist }));
                return;
            }

            // Same video - apply time and play state
            const currentTime = playerRef.current.getCurrentTime?.() || 0;
            const drift = Math.abs(currentTime - syncState.currentTime);
            isApplyingRemoteStateRef.current = true;

            // Tighter drift threshold (0.5s) for better sync
            if (drift > 0.5 || forceSeek) {
                playerRef.current.seekTo(syncState.currentTime, "seconds");
            }

            setIsPlaying(syncState.playing);
            dispatch(setHostPlaybackPlaying(syncState.playing));
            pendingSyncRef.current = null;
            
            // Track sync started (first time sync is applied successfully)
            if (!syncStartedTrackedRef.current && roomId) {
                const latencyMs = drift > 0.5 ? Math.round(drift * 1000) : undefined;
                trackSyncStarted(roomId, latencyMs);
                syncStartedTrackedRef.current = true;
            }
        },
        [playerRef, isHost, dispatch, enabled, roomId]
    );

    // Video ready handler - apply pending sync or request state
    const onReady = useCallback(() => {
        if (!enabled) return;

        if (pendingSyncRef.current && playerRef.current && !isHost) {
            // Apply pending sync after video loads
            setTimeout(() => {
                if (playerRef.current && pendingSyncRef.current) {
                    isApplyingRemoteStateRef.current = true;
                    playerRef.current.seekTo(pendingSyncRef.current.currentTime, "seconds");
                    setIsPlaying(pendingSyncRef.current.playing);
                    dispatch(setHostPlaybackPlaying(pendingSyncRef.current.playing));
                    pendingSyncRef.current = null;
                    setTimeout(() => {
                        isApplyingRemoteStateRef.current = false;
                    }, 100);
                }
            }, 800);
        } else if (!isHost && roomId && !initialSyncDoneRef.current) {
            // No pending sync - request current state from host
            socket?.emit(SocketEvent.REQUEST_CURRENT_VIDEO, { roomId });
        }
    }, [playerRef, isHost, roomId, socket, enabled, dispatch]);

    // Safety net: request initial sync when joining (non-host only)
    useEffect(() => {
        if (!isHost && roomId && enabled && socket) {
            const timeout = setTimeout(() => {
                socket.emit(SocketEvent.REQUEST_CURRENT_VIDEO, { roomId });
            }, 1000);

            return () => clearTimeout(timeout);
        }
    }, [isHost, roomId, enabled, socket]);

    const onPlay = useCallback(
        (event: string) => {
            if (event === "seekend" || !enabled) return;
            if (isApplyingRemoteStateRef.current && !isHost) return;
            setIsPlaying(true);
            isPlayingRef.current = true;
            dispatch(setHostPlaybackPlaying(true));

            // Track video started (first time only)
            if (!videoStartedTrackedRef.current && roomId) {
                const state = store.getState() as RootState;
                const playlist = state.room.playlist || [];
                const selected = playlist.find((p) => p.selected) || playlist[0];
                const source = (selected?.source || "url") as "file" | "url" | "screen";
                trackVideoStarted(roomId, source, isHost);
                videoStartedTrackedRef.current = true;
                
                // Track sync started for host (when host starts playing)
                if (isHost && !syncStartedTrackedRef.current) {
                    trackSyncStarted(roomId);
                    syncStartedTrackedRef.current = true;
                }
            }

            if (socket && roomId && isHost) {
                socket.emit(SocketEvent.ONPLAY, { roomId, videoState: getHostState() });
                socket.emit(SocketEvent.HOST_PLAYBACK_STATE, { roomId, playing: true });
            }
        },
        [isHost, roomId, socket, getHostState, enabled, dispatch]
    );

    const onPause = useCallback(
        (event: string) => {
            if (event === "seekend" || !enabled) return;
            if (isApplyingRemoteStateRef.current && !isHost) return;
            setIsPlaying(false);
            isPlayingRef.current = false;
            dispatch(setHostPlaybackPlaying(false));

            if (socket && roomId && isHost) {
                socket.emit(SocketEvent.ONPAUSE, { roomId, videoState: getHostState() });
                socket.emit(SocketEvent.HOST_PLAYBACK_STATE, { roomId, playing: false });
            }
        },
        [isHost, roomId, socket, getHostState, enabled, dispatch]
    );

    const onSeeked = useCallback(() => {
        if (!socket || !roomId || !isHost || !enabled) {
            console.warn(`[useSync] onSeeked called but conditions not met:`, {
                socket: !!socket,
                roomId,
                isHost,
                enabled,
            });
            return;
        }

        if (seekTimeoutRef.current) clearTimeout(seekTimeoutRef.current);

        // Retry logic to get accurate seek time after player updates
        const checkTime = (attempt: number, max = 10) => {
            const state = getHostState();
            const currentTime = state?.currentTime;
            const isValidTime =
                typeof currentTime === "number" &&
                !isNaN(currentTime) &&
                isFinite(currentTime) &&
                currentTime >= 0;

            console.log(`[useSync] checkTime attempt ${attempt}/${max}:`, {
                currentTime,
                isValidTime,
                state,
                playerRefExists: !!playerRef.current,
                playerCurrentTime: playerRef.current?.getCurrentTime?.(),
            });

            // Always send if we have a valid number (including 0) or max attempts reached
            if (isValidTime || attempt >= max) {
                socket.emit(SocketEvent.ONSEEKED, { roomId, videoState: state });
                seekTimeoutRef.current = null;
            } else {
                // Retry after a short delay to let player update
                seekTimeoutRef.current = setTimeout(() => checkTime(attempt + 1, max), 100);
            }
        };

        // Start checking after a short delay to let the player update its currentTime
        console.log(`[useSync] onSeeked triggered, starting retry logic...`);
        seekTimeoutRef.current = setTimeout(() => checkTime(1), 200);
    }, [isHost, roomId, socket, getHostState, playerRef, enabled]);

    // Host: select video (by playlist index)
    const selectVideo = useCallback(
        (index: number) => {
            if (!isHost || !socket || !roomId || !enabled) return;

            const state = store.getState() as RootState;
            const nextPlaylist = buildPlaylistWithSelectedIndex(state, index);
            dispatch(updateRoomInfo({ playlist: nextPlaylist }));
            socket.emit(SocketEvent.SELECT_VIDEO, { roomId, selectedIndex: index });
        },
        [isHost, socket, roomId, dispatch, enabled]
    );

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
            if (!isHost) {
                const state = store.getState() as RootState;
                const playlist = state.room.playlist || [];
                const currentIndex = getSelectedPlaylistIndex(state);
                console.log("[useSync] VIDEO_SELECTED received:", { selectedIndex, currentIndex, playlistLength: playlist.length });
                
                // Validate selectedIndex is within bounds
                if (selectedIndex < 0 || selectedIndex >= playlist.length) {
                    console.warn("[useSync] Invalid selectedIndex:", selectedIndex, "playlist length:", playlist.length);
                    return;
                }
                
                // Always update if index is different, or if current selection doesn't match
                if (selectedIndex !== currentIndex || !playlist[selectedIndex]?.selected) {
                    pendingSyncRef.current = { selectedIndex, playing: false, currentTime: 0 };
                    const nextPlaylist = buildPlaylistWithSelectedIndex(state, selectedIndex);
                    console.log("[useSync] Updating playlist with selectedIndex:", selectedIndex, "new playlist:", nextPlaylist.map((p, i) => ({ index: i, id: p.id, link: p.link, selected: p.selected })));
                    dispatch(updateRoomInfo({ playlist: nextPlaylist }));
                } else {
                    console.log("[useSync] Selected index matches current and is already selected, skipping update");
                }
            }
        };

        // Host responds to current video request
        const handleRequestCurrentVideo = (data?: { requesterId?: string }) => {
            if (!isHost || !playerRef.current) return;

            const state = getHostState();
            socket.emit(SocketEvent.CURRENT_VIDEO_STATE, {
                roomId: roomId ?? "room",
                ...state,
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
