"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, store } from "@/lib/store";
import { Player } from "@/components/VideoPlayer";
import PlayerOverlay from "@/components/Container/PlayerOverlay";
import StreamPlayerEmptyState from "@/components/Container/StreamPlayerEmptyState";
import type ReactPlayer from "react-player";
import { useP2PStream } from "@/hooks/useP2PStream";
import { useStreamSource } from "@/hooks/useStreamSource";
import { useRoomContext } from "@/context/RoomContext";
import { helper } from "@/utils";
import { trackVideoStarted, trackSyncStarted } from "@/lib/analytics";
import { toggleBottomSheet } from "@/lib/store/slices/roomSlice";

type Props = {
    fullscreenTargetRef?: React.RefObject<HTMLDivElement>;
    setFocus?: () => void;
};

const P2PStreamPlayer = ({ fullscreenTargetRef, setFocus }: Props) => {
    const roomState = useSelector((state: RootState) => state.room);
    const authState = useSelector((state: RootState) => state.auth);
    const playerRef = useRef<ReactPlayer>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const [isPaused, setIsPaused] = useState(false);
    const [pauseFrameUrl, setPauseFrameUrl] = useState<string | null>(null);
    const isSeekingRef = useRef(false);
    const pendingVideoReadyRef = useRef(false);
    const lastInitializedItemIdRef = useRef<string | null>(null);
    const isInitialSetupRef = useRef(true);
    const previousSourceRef = useRef<"file" | "url" | "screen" | null>(null);
    const videoStartedTrackedRef = useRef(false);
    const syncStartedTrackedRef = useRef(false);
    const pendingInitializationRef = useRef(false);
    /** True while a video-ready initialization is mid-flight, so duplicates are dropped. */
    const videoReadyInFlightRef = useRef(false);
    const autoStoppedForMissingSourceRef = useRef(false);
    
    const { isJoined, roomType, isHost, hostLeft, roomId, captureWatchTime } = useRoomContext();
    const dispatch = useDispatch();

    // ============================================================================
    // Layer 1: Source Layer
    // ============================================================================

    const {
        getStream,
        playableSource,
        activeItem,
        isScreenSharing,
        onVideoReady,
    } = useStreamSource({
        playerRef,
        isHost,
    });
    
    const captureFrame = useCallback(() => {
        const video = playerRef.current?.getInternalPlayer() as HTMLVideoElement | null;
        if (!video) return null;

        try {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth || 1920;
            canvas.height = video.videoHeight || 1080;
            canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height);
            return canvas.toDataURL('image/jpeg', 0.8);
        } catch {
            return null;
        }
    }, []);

    // Stream callbacks
    const handleStreamReceived = useCallback((stream: MediaStream) => {
        setRemoteStream(stream);
        console.log("[P2PStreamPlayer] Remote stream received", stream.getAudioTracks(), stream.getVideoTracks());
        setIsPaused(false);
        setPauseFrameUrl(null);
        
        // Track sync started when consumer receives stream
        if (!isHost && !syncStartedTrackedRef.current && roomId) {
            trackSyncStarted(roomId);
            syncStartedTrackedRef.current = true;
        }
    }, [isHost, roomId]);

    const handleStreamPaused = useCallback(() => {
        setPauseFrameUrl(null);
        const frameUrl = captureFrame();
        setPauseFrameUrl(frameUrl);
        setIsPaused(true);
    }, [captureFrame]);

    const handleStreamResumed = useCallback(() => {
        setIsPaused(false);
        setTimeout(() => {
            setPauseFrameUrl(null);
        }, 500);
    }, []);

    const handleStreamStopped = useCallback(() => {
        setRemoteStream(null);
        console.log("[P2PStreamPlayer] Stream stopped");
    }, []);

    // Initialize P2P connection
    const {
        isInitialized,
        initializeFromJoinResponse,
        onSeekStart,
        onSeekEnd,
        onPlay: streamOnPlay,
        onPause,
        stopStream,
    } = useP2PStream({
        roomId: roomState.roomId,
        getStream,
        isHost,
        enabled: isJoined,
        username: authState.user?.username || authState.user?.name || "User",
        email: authState.user?.email,
        profile: authState.user?.profile,
        onStreamReceived: handleStreamReceived,
        onStreamPaused: handleStreamPaused,
        onStreamResumed: handleStreamResumed,
        onStreamStopped: handleStreamStopped,
    });

    // ============================================================================
    // Player Event Handlers
    // ============================================================================

    const handleVideoReady = useCallback(async () => {
        console.log("[P2PStreamPlayer] Video ready", { isHost, isJoined });
        if (!isHost) return;
        
        if (!isJoined) {
            console.log("[P2PStreamPlayer] Video ready but not joined yet - deferring initialization");
            pendingInitializationRef.current = true;
            onVideoReady();
            return;
        }
        
        onVideoReady();
        
        const currentItemId = activeItem?.id || null;
        const itemChanged = lastInitializedItemIdRef.current !== currentItemId;
        
        if (!isInitialSetupRef.current && !itemChanged) {
            console.log("[P2PStreamPlayer] Video ready but item hasn't changed - skipping");
            return;
        }
        
        if (isSeekingRef.current && !isInitialSetupRef.current) {
            console.log("[P2PStreamPlayer] Video ready during seek - deferring");
            pendingVideoReadyRef.current = true;
            return;
        }
        
        // Everything above is synchronous, so nothing can interleave. The wait below can, and
        // the flags this function checks are only cleared at the very end — so a second
        // `onReady` arriving during the wait passed the same guard, waited its own 800ms, and
        // initialised all over again. ReactPlayer fires `onReady` on more than just first load,
        // which is how one share turned into five renegotiations and five orphaned peer
        // connections. Claim the work for the duration instead.
        if (videoReadyInFlightRef.current) {
            console.log("[P2PStreamPlayer] Video ready ignored - initialization already in flight");
            return;
        }
        videoReadyInFlightRef.current = true;

        try {
            await new Promise(r => setTimeout(r, 800));

            if (!isJoined) {
                console.log("[P2PStreamPlayer] Not joined after delay - aborting initialization");
                pendingInitializationRef.current = true;
                return;
            }

            if (!isInitialSetupRef.current && !isScreenSharing) {
                const video = playerRef.current?.getInternalPlayer() as HTMLVideoElement | null;
                if (video && video.paused) {
                    console.log("[P2PStreamPlayer] Video is paused - deferring");
                    pendingVideoReadyRef.current = true;
                    return;
                }
            }

            initializeFromJoinResponse();
            pendingInitializationRef.current = false;
            lastInitializedItemIdRef.current = currentItemId;
            isInitialSetupRef.current = false;
        } finally {
            // Released even on the deferral paths above, so their retry can still run.
            videoReadyInFlightRef.current = false;
        }
    }, [activeItem, onVideoReady, initializeFromJoinResponse, isHost, isJoined, isScreenSharing]);
    
    // ============================================================================
    // Initialization Effects
    // ============================================================================

    useEffect(() => {
        if (isHost) return;
        if (!isJoined) return;
        initializeFromJoinResponse();
    }, [isHost, isJoined, initializeFromJoinResponse]);
    
    useEffect(() => {
        if (!isHost) return;
        const currentItemId = activeItem?.id || null;
        if (currentItemId !== lastInitializedItemIdRef.current) {
            console.log("[P2PStreamPlayer] Active item changed, will reinitialize on next video ready");
        }
    }, [activeItem?.id, isHost]);

    useEffect(() => {
        if (!isHost) return;

        const currentSource = activeItem?.source ?? null;
        const switchedToScreen =
            previousSourceRef.current !== "screen" && currentSource === "screen";
        previousSourceRef.current = currentSource;

        if (!switchedToScreen) return;

        streamOnPlay("switch-to-screen");
    }, [isHost, activeItem?.source, streamOnPlay]);
    
    useEffect(() => {
        if (!isHost || !isJoined || !pendingInitializationRef.current) return;
        
        console.log("[P2PStreamPlayer] isJoined is now true, retrying pending initialization");
        const video = playerRef.current?.getInternalPlayer() as HTMLVideoElement | null;
        if (video) {
            handleVideoReady();
        } else {
            console.log("[P2PStreamPlayer] Video element not ready yet");
        }
    }, [isHost, isJoined, handleVideoReady]);
    
    const handleVideoEnded = useCallback(() => {
        // Handle video ended
    }, []);

    const onPlay = useCallback((event: string) => {
        streamOnPlay(event);
        
        if (!videoStartedTrackedRef.current && roomId) {
            const state = store.getState() as RootState;
            const playlist = state.room.playlist || [];
            const selected = playlist.find((p) => p.selected) || playlist[0];
            const source = (selected?.source || "screen") as "file" | "url" | "screen";
            trackVideoStarted(roomId, source, isHost);
            videoStartedTrackedRef.current = true;
            
            if (isHost && !syncStartedTrackedRef.current) {
                trackSyncStarted(roomId);
                syncStartedTrackedRef.current = true;
            }
        }
        
        if (pendingVideoReadyRef.current && isHost && !isSeekingRef.current) {
            const currentItemId = activeItem?.id || null;
            const itemChanged = lastInitializedItemIdRef.current !== currentItemId;
            
            if (itemChanged) {
                pendingVideoReadyRef.current = false;
                setTimeout(async () => {
                    const video = playerRef.current?.getInternalPlayer() as HTMLVideoElement | null;
                    if (video && !video.paused) {
                        console.log("[P2PStreamPlayer] Handling pending video ready after item change");
                        initializeFromJoinResponse();
                        lastInitializedItemIdRef.current = currentItemId;
                    }
                }, 300);
            } else {
                pendingVideoReadyRef.current = false;
            }
        }
    }, [streamOnPlay, isHost, initializeFromJoinResponse, activeItem, roomId]);

    useEffect(() => {
        if (isHost) return;
        if (!isInitialized || hostLeft) {
            setRemoteStream(null);
        }
    }, [isHost, isInitialized, hostLeft]);

    useEffect(() => {
        if (!isHost || !isInitialized) return;

        const hasNoActiveItem = !activeItem;
        const screenShareEnded = activeItem?.source === "screen" && !isScreenSharing;
        const shouldStop = hasNoActiveItem || screenShareEnded;

        if (!shouldStop) {
            autoStoppedForMissingSourceRef.current = false;
            return;
        }

        if (autoStoppedForMissingSourceRef.current) return;
        autoStoppedForMissingSourceRef.current = true;

        stopStream(hasNoActiveItem ? "playlist-empty" : "screen-share-ended");
    }, [isHost, isInitialized, activeItem, isScreenSharing, stopStream]);

    // ============================================================================
    // Render
    // ============================================================================

    const source = isHost ? playableSource : remoteStream;
    console.log("[P2PStreamPlayer] Source:", source);

    if (!source || hostLeft) {
        return (
            <StreamPlayerEmptyState
                isHost={isHost}
                roomType={roomType}
                hostLeft={hostLeft}
                remoteStream={remoteStream}
                isInitialized={isInitialized}
                playlist={roomState.playlist}
            />
        );
    }

    return (
        <div className="relative w-full h-full">
            <Player
                key={activeItem?.id}
                playerRef={playerRef}
                playing={helper.getInitialPlayerState({
                    url: source,
                    roomType: roomType || "stream",
                    host: isHost,
                    focused: roomState.focused,
                    screenSharing: isScreenSharing,
                    hostLeft: hostLeft,
                    paused: isPaused
                }).playing}
                onReady={handleVideoReady}
                onEnded={handleVideoEnded}
                onProgress={captureWatchTime}
                onSeekStart={() => {
                    isSeekingRef.current = true;
                    onSeekStart();
                }}
                onSeekEnd={() => {
                    onSeekEnd();
                    setTimeout(() => {
                        isSeekingRef.current = false;
                        
                        if (pendingVideoReadyRef.current && isHost) {
                            const currentItemId = activeItem?.id || null;
                            const itemChanged = lastInitializedItemIdRef.current !== currentItemId;
                            
                            if (itemChanged) {
                                const video = playerRef.current?.getInternalPlayer() as HTMLVideoElement | null;
                                if (video && !video.paused) {
                                    pendingVideoReadyRef.current = false;
                                    setTimeout(async () => {
                                        console.log("[P2PStreamPlayer] Handling pending video ready after item change");
                                        initializeFromJoinResponse();
                                        lastInitializedItemIdRef.current = currentItemId;
                                    }, 300);
                                }
                            } else {
                                pendingVideoReadyRef.current = false;
                            }
                        }
                    }, 500);
                }}
                fullscreenTargetRef={fullscreenTargetRef}
                url={source}
                muted={helper.getInitialPlayerState({
                    url: source,
                    roomType: roomType || "stream",
                    host: isHost,
                    focused: roomState.focused,
                    screenSharing: isScreenSharing,
                    hostLeft: hostLeft,
                    paused: isPaused
                }).muted}
                hasUserInteracted={roomState.focused}
                onPlay={onPlay}
                onPause={onPause}
                hasVideoTrack={!activeItem?.onlyAudio}
                onMute={setFocus}
                onOpenStore={() => dispatch(toggleBottomSheet())}
                disableControls={helper.getPlayerControlsConfig(source, isHost).disableControls}
                hideControls={helper.getPlayerControlsConfig(source, isHost).hideControls}
                autoResumeOnFullscreenExit={!isHost}
            >
                <PlayerOverlay />
            </Player>
        </div>
    );
};

export default P2PStreamPlayer;

// Made with Bob
