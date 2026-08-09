"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, store } from "@/lib/store";
import { Player } from "@/components/VideoPlayer";
import { ControlComponents } from "@/components/VideoPlayer/Player";
import PlayerOverlay from "@/components/Container/PlayerOverlay";
import StreamPlayerEmptyState from "@/components/Container/StreamPlayerEmptyState";
import type ReactPlayer from "react-player";
import { useStream } from "@/hooks/useStream";
import { useStreamSource } from "@/hooks/useStreamSource";
import { useRoomContext } from "@/context/RoomContext";
import { helper } from "@/utils";
import { trackVideoStarted, trackSyncStarted } from "@/lib/analytics";
import { toggleBottomSheet } from "@/lib/store/slices/roomSlice";

type Props = {
    fullscreenTargetRef?: React.RefObject<HTMLDivElement>;
    setFocus?: () => void;
};

const StreamPlayer = ({ fullscreenTargetRef, setFocus }: Props) => {
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
    const videoStartedTrackedRef = useRef(false); // Track if video_started was already tracked
    const syncStartedTrackedRef = useRef(false); // Track if sync_started was already tracked
    const pendingInitializationRef = useRef(false);
    const autoStoppedForMissingSourceRef = useRef(false);
    
    const { isJoined, roomType, isHost, hostLeft, roomId, captureWatchTime } = useRoomContext();
    const dispatch = useDispatch()
    const isPlaybackBlocked = roomState.settings.isPlaybackBlocked;
    // ============================================================================
    // Layer 1: Source Layer
    // ============================================================================

    // Get source-agnostic stream getter and playable source
    const {
        getStream,
        playableSource,
        activeItem,
        isScreenSharing,
        onVideoReady,
        // onStreamHasVideo
    } = useStreamSource({
        playerRef,
        isHost,
        // remoteStream, // Pass remoteStream so useStreamSource can check video tracks for consumers
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
        console.log("[StreamPlayer] Remote stream received", stream.getAudioTracks(), stream.getVideoTracks());
        setIsPaused(false);
        console.log("[StreamPlayer] Stream has video tracks:", stream.getVideoTracks().length > 0);
        setPauseFrameUrl(null);
        
        // Track sync started when consumer receives stream
        if (!isHost && !syncStartedTrackedRef.current && roomId) {
            trackSyncStarted(roomId);
            syncStartedTrackedRef.current = true;
        }
    }, [isHost, roomId]);

    

    const handleStreamPaused = useCallback(() => {
        // Clear previous pause frame (data URL, no need to revoke)
        setPauseFrameUrl(null);
        
        const frameUrl = captureFrame();
        setPauseFrameUrl(frameUrl);
        setIsPaused(true);
    }, [captureFrame]);

    const handleStreamResumed = useCallback(() => {
        setIsPaused(false);
        // Clear pause frame after a delay (data URL, no need to revoke)
        setTimeout(() => {
            setPauseFrameUrl(null);
        }, 500);
    }, []);

    const handleStreamStopped = useCallback(() => {
        setRemoteStream(null);
        console.log("[StreamPlayer] Stream stopped");
    }, []);

    // const handleStreamHasVideo = useCallback((hasVideoTrack: boolean) => {
    //     onStreamHasVideo(hasVideoTrack);
    //     console.log("[StreamPlayer] Stream has video track: ==", {videoTrack: remoteStream?.getVideoTracks(), audioTrack: remoteStream?.getAudioTracks()});
    // }, [onStreamHasVideo, remoteStream]);
    // Initialize MediaSoup transport (completely source-agnostic)
    const {
        isInitialized,
        initializeFromJoinResponse,
        onSeekStart,
        onSeekEnd,
        onPlay: streamOnPlay,
        onPause,
        stopStream,
    } = useStream({
        roomId: roomState.roomId,
        getStream, // Source-agnostic! useStream doesn't care where this comes from
        isHost,
        enabled: isJoined,
        username: authState.user?.username || authState.user?.name || "User",
        email: authState.user?.email,
        profile: authState.user?.profile,
        onStreamReceived: handleStreamReceived,
        onStreamPaused: handleStreamPaused,
        onStreamResumed: handleStreamResumed,
        onStreamStopped: handleStreamStopped,
        // onStreamHasVideo: handleStreamHasVideo,
    });

    
    // ============================================================================
    // Player Event Handlers
    // ============================================================================
    // const isVideoReadyRef = useRef(false);
    const handleVideoReady = useCallback(async () => {
        console.log("============================================================ [StreamPlayer] Video ready ========================================================================", { isHost, isJoined });
        if (!isHost) return;
        
        // RACE CONDITION FIX: Check if we're joined before proceeding
        if (!isJoined) {
            console.log("[StreamPlayer] Video ready but not joined yet - deferring initialization until join completes");
            pendingInitializationRef.current = true;
            // Still call onVideoReady to setup the source, but don't initialize MediaSoup yet
            onVideoReady();
            return;
        }
        
        onVideoReady();
        console.log("============================================================ [StreamPlayer] Video ready (after onVideoReady) ========================================================================");
        
        const currentItemId = activeItem?.id || null;
        const itemChanged = lastInitializedItemIdRef.current !== currentItemId;
        
        // Only initialize/replace tracks if:
        // 1. This is the initial setup (first time)
        // 2. The active item actually changed (different file/URL)
        // 3. NOT if we're just seeking (same item, just different position)
        if (!isInitialSetupRef.current && !itemChanged) {
            console.log("[StreamPlayer] Video ready but item hasn't changed - skipping track replacement (likely from seek)");
            return;
        }
        
        // If we're currently seeking and this is not initial setup, defer
        if (isSeekingRef.current && !isInitialSetupRef.current) {
            console.log("[StreamPlayer] Video ready during seek - deferring track replacement");
            pendingVideoReadyRef.current = true;
            return;
        }
        
        // * Making here a small delay to ensure the video is ready with the stream
        await new Promise(r => setTimeout(r, 800));
        
        // Double-check isJoined after delay (in case it changed)
        if (!isJoined) {
            console.log("[StreamPlayer] Not joined after delay - aborting initialization");
            pendingInitializationRef.current = true;
            return;
        }
        
        // Check if video is playing before replacing tracks (only for non-initial setup).
        // For screen sharing, do not defer on paused file state from previous source.
        if (!isInitialSetupRef.current && !isScreenSharing) {
            const video = playerRef.current?.getInternalPlayer() as HTMLVideoElement | null;
            if (video && video.paused) {
                console.log("[StreamPlayer] Video is paused - deferring track replacement until play");
                pendingVideoReadyRef.current = true;
                return;
            }
        }
        
        // * commenting this below because this was causing the issue while reshairng the screen becuase it was calling two time the getstream
        // const stream = getStream();
        // console.log("[StreamPlayer] Stream tracks:", {
        //     audio: stream?.getAudioTracks().map(t => ({ id: t.id, readyState: t.readyState, enabled: t.enabled })),
        //     video: stream?.getVideoTracks().map(t => ({ id: t.id, readyState: t.readyState, enabled: t.enabled }))
        // });
        // Here I can intiate the mediasoup stream productions
        initializeFromJoinResponse();
        pendingInitializationRef.current = false;
        
        // Mark that we've initialized for this item
        lastInitializedItemIdRef.current = currentItemId;
        isInitialSetupRef.current = false;
        
        // console.log({ activeItem, stream: getStream(), playableSource });
        // hasVideoTrack is now managed by useStreamSource based on actual stream tracks
    }, [activeItem, onVideoReady, initializeFromJoinResponse, isHost, isJoined, isScreenSharing]);
    
    // ============================================================================
    // Initialization Effects
    // ============================================================================

    useEffect(() => {
        if (isHost) return;
        if (!isJoined) return;
        initializeFromJoinResponse();
    }, [isHost, isJoined, initializeFromJoinResponse]);
    
    // Reset tracking when active item changes
    useEffect(() => {
        if (!isHost) return;
        const currentItemId = activeItem?.id || null;
        if (currentItemId !== lastInitializedItemIdRef.current) {
            console.log("[StreamPlayer] Active item changed, will reinitialize on next video ready");
            // Don't reset isInitialSetupRef here - let handleVideoReady handle it
        }
    }, [activeItem?.id, isHost]);

    useEffect(() => {
        // * This effect listens for changes in the active item's source (file, URL, screen) and triggers a play event when switching to screen sharing.
        if (!isHost) return;

        const currentSource =
            activeItem?.source === "game" ? null : (activeItem?.source ?? null);
        const switchedToScreen =
            previousSourceRef.current !== "screen" && currentSource === "screen";
        previousSourceRef.current = currentSource;

        if (!switchedToScreen) return;

        // Ensure producers are resumed when switching from paused file to screen share.
        streamOnPlay("switch-to-screen");
    }, [isHost, activeItem?.source, streamOnPlay]);
    
    // Handle pending initialization when isJoined becomes true
    useEffect(() => {
        if (!isHost || !isJoined || !pendingInitializationRef.current) return;
        
        console.log("[StreamPlayer] isJoined is now true, retrying pending initialization");
        // Trigger initialization by calling handleVideoReady logic
        // We'll manually trigger the video ready handler
        const video = playerRef.current?.getInternalPlayer() as HTMLVideoElement | null;
        if (video) {
            // Call the handler again now that we're joined
            handleVideoReady();
        } else {
            // If video isn't ready yet, it will be called when video becomes ready
            console.log("[StreamPlayer] Video element not ready yet, will initialize when ready");
        }
    }, [isHost, isJoined, handleVideoReady]);
    
    const handleVideoEnded = useCallback(() => {
    
    }, []);

    const onPlay = useCallback((event: string) => {
        streamOnPlay(event);
        
        // Track video started (first time only)
        if (!videoStartedTrackedRef.current && roomId) {
            const state = store.getState() as RootState;
            const playlist = state.room.playlist || [];
            const selected = playlist.find((p) => p.selected) || playlist[0];
            const source = (selected?.source || "screen") as "file" | "url" | "screen";
            trackVideoStarted(roomId, source, isHost);
            videoStartedTrackedRef.current = true;
            
            // Track sync started for host (when host starts playing)
            if (isHost && !syncStartedTrackedRef.current) {
                trackSyncStarted(roomId);
                syncStartedTrackedRef.current = true;
            }
        }
        
        // If we have a pending video ready (from item change, not seek), handle it now that video is playing
        if (pendingVideoReadyRef.current && isHost && !isSeekingRef.current) {
            const currentItemId = activeItem?.id || null;
            const itemChanged = lastInitializedItemIdRef.current !== currentItemId;
            
            // Only handle pending if item actually changed
            if (itemChanged) {
                pendingVideoReadyRef.current = false;
                // Wait a bit for the video to start playing and tracks to become active
                // ? Here also need to understand do we need time delay?
                setTimeout(async () => {
                    const video = playerRef.current?.getInternalPlayer() as HTMLVideoElement | null;
                    if (video && !video.paused) {
                        // const stream = getStream();
                        // if (stream) {
                            console.log("[StreamPlayer] Handling pending video ready after item change");
                            initializeFromJoinResponse();
                            lastInitializedItemIdRef.current = currentItemId;
                        // }
                    }
                }, 300);
            } else {
                // If item didn't change, just clear the pending flag (was likely from seek)
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

    //** Pause video if it is playing when subscription modal comes up */
    useEffect(() => {
        if (roomState.settings.upgradeSubscriptionModal && isHost) {
            // Pause the video when upgrade modal opens (only for host)
            const video = playerRef.current?.getInternalPlayer() as HTMLVideoElement | null;
            if (video && !video.paused) {
                video.pause();
                onPause();
            }
        }
    }, [roomState.settings.upgradeSubscriptionModal, isHost, onPause]);

    // ============================================================================
    // Render
    // ============================================================================

    // Determine what to play
    // Host: uses playableSource from useStreamSource (file URL, link, or screen stream)
    // Consumer: uses remoteStream from useStream
    const source = isHost ? playableSource : remoteStream;
    console.log("[StreamPlayer] Source:", source);
    // Show empty state when: no source available OR host has left
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

    const controlsConfig = helper.getPlayerControlsConfig(source, isHost);

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
                    paused: isPaused || isPlaybackBlocked
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
                    // Reset seeking flag after a delay to allow video to resume
                    setTimeout(() => {
                        isSeekingRef.current = false;
                        
                        // Note: Producers should resume automatically when onPlay('seekend') is called
                        // after the video resumes, now that we allow resume after seek completes
                        
                        // Only handle pending if item actually changed (not from seek)
                        // ? Need to understand do we really need this time interval
                        if (pendingVideoReadyRef.current && isHost) {
                            const currentItemId = activeItem?.id || null;
                            const itemChanged = lastInitializedItemIdRef.current !== currentItemId;
                            
                            if (itemChanged) {
                                const video = playerRef.current?.getInternalPlayer() as HTMLVideoElement | null;
                                if (video && !video.paused) {
                                    pendingVideoReadyRef.current = false;
                                    setTimeout(async () => {
                                        // const stream = getStream();
                                        // if (stream) {
                                            console.log("[StreamPlayer] Handling pending video ready after item change");
                                            initializeFromJoinResponse();
                                            lastInitializedItemIdRef.current = currentItemId;
                                        // }
                                    }, 300);
                                }
                            } else {
                                // Item didn't change, just clear pending (was from seek)
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
                disableControls={isPlaybackBlocked ? [...controlsConfig.disableControls, ControlComponents.PLAY] : controlsConfig.disableControls}
                hideControls={isPlaybackBlocked ? [...controlsConfig.hideControls, ControlComponents.PLAY] : controlsConfig.hideControls}
                autoResumeOnFullscreenExit={!isHost}
            >
                <PlayerOverlay />
            </Player>
        </div>
    );
};

export default StreamPlayer;
