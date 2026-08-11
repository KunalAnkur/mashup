"use client"
import { useState, useRef, useEffect, ReactNode, useCallback } from "react";
import ReactPlayer from "react-player";
import screenfull from "screenfull";
import { isMobile } from "react-device-detect";
import { PlayPauseOverlay } from "@/components/VideoPlayer/PlayPauseOverlay";
import { ControlBar } from "@/components/VideoPlayer/ControlBar";
import AudioVisualizer from "@/components/VideoPlayer/AudioVisualizer";
import { SourceProps } from "react-player/base";
import { FileConfig } from "react-player/file";
import { formatVideoTime } from "@/utils/timeFormatter";
import { FaVolumeMute } from "react-icons/fa"
type IOSVideoElement = HTMLVideoElement & {
    webkitEnterFullscreen?: () => void;
    webkitDisplayingFullscreen?: boolean;
};
export enum ControlComponents {
    PLAY = 'play',
    VOLUME = 'volume',
    PROGRESS = 'progress',
    DURATION = 'duration',
    OVERLAY = 'overlay',
    FULLSCREEN = 'fullscreen',
    STORE = 'store',
    HIDE_CONTROLS = 'hide_controls',
    BROADCAST_SYNC = 'broad_sync'
}
type VideoPlayerProps = {
    url?: string | string[] | SourceProps[] | MediaStream
    playing?: boolean;
    muted?: boolean;
    volume?: number;
    progress?: number;
    duration?: number;
    width?: string;
    height?: string;
    onPlay?: (event: string) => void;
    onPause?: (event: string) => void;
    onVolumeChange?: (volume: number) => void;
    onMute?: (muted: boolean) => void;
    onSeek?: (progress: number) => void;
    onSeekStart?: () => void;
    onSeekEnd?: (seekTime?: number, seekPercent?: number) => void;
    onDuration?: (duration: number) => void;
    onFullscreenChange?: (isFullscreen: boolean) => void;
    onReady?: () => void;
    onEnded?: () => void;
    onProgress?: () => void;
    onOpenStore?: () => void;
    syncWithHost?: () => void;
    playerRef?: React.RefObject<ReactPlayer | null>;
    controls?: boolean;
    loop?: boolean;
    hasUserInteracted?: boolean;
    fullscreenTargetRef?: React.RefObject<HTMLElement>;
    children?: ReactNode;
    className?: string;
    FileConfig?: FileConfig;
    disableControls?: ControlComponents[];
    hideControls?: ControlComponents[];
    hasVideoTrack?: boolean; // External prop to indicate if video track exists (for AudioVisualizer)
    disableSeekPauseResume?: boolean; // If true, video won't pause on seek start or resume on seek end
    autoResumeOnFullscreenExit?: boolean; // For consumers on iOS: resume if native fullscreen exit pauses playback
};

const VideoPlayer = ({
    url,
    playing: externalPlaying = false,
    muted: externalMuted = false,
    volume: externalVolume = 0.5,
    progress: externalProgress = 0,
    duration: externalDuration = 0,
    onPlay,
    onPause,
    onVolumeChange,
    onMute,
    onSeek,
    onSeekStart,
    onSeekEnd,
    onDuration,
    onReady,
    onEnded,
    onFullscreenChange,
    onProgress,
    onOpenStore,
    syncWithHost,
    controls = true,
    loop = false,
    hasUserInteracted = true,
    playerRef: externalPlayerRef,
    fullscreenTargetRef,
    className,
    width,
    height,
    disableControls = [],
    hideControls = [],
    children,
    hasVideoTrack: externalHasVideoTrack,
    disableSeekPauseResume = false,
    autoResumeOnFullscreenExit = false,
}: VideoPlayerProps) => {
    // State management
    const [playing, setPlaying] = useState(externalPlaying);
    const [muted, setMuted] = useState(externalMuted);
    const [volume, setVolume] = useState(externalVolume);
    const [progress, setProgress] = useState(externalProgress);
    const [duration, setDuration] = useState(externalDuration);
    const [buffered, setBuffered] = useState(0);
    const [fullscreen, setFullscreen] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [isBuffering, setIsBuffering] = useState(false);
    const [nativeControlsActive, setNativeControlsActive] = useState(false);
    const playingRef = useRef(playing);
    const durationRef = useRef(externalDuration);
    // Refs
    const internalPlayerRef = useRef<ReactPlayer>(null);
    const playerRef = externalPlayerRef || internalPlayerRef;
    const playerContainerRef = useRef<HTMLDivElement>(null);
    const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
    const nativeControlsTimerRef = useRef<NodeJS.Timeout | null>(null);
    const seekDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const progressResumeRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const wasPlayingBeforeSeek = useRef(false);
    const isSeekingRef = useRef(false);
    const ignoreProgressRef = useRef(false);
    const userMutedRef = useRef(false);
    // Whether the current externally-driven playback has already been announced via onPlay.
    // Starts false so a player that mounts already playing still counts as a start.
    const externalStartAnnouncedRef = useRef(false);
    // onPlay is read through a ref so announcing it cannot become a dependency of the
    // external-prop sync below: a parent re-creating its onPlay would otherwise re-run that
    // effect and force `playing` back to externalPlaying, overriding a local pause.
    const onPlayRef = useRef(onPlay);
    useEffect(() => {
        onPlayRef.current = onPlay;
    }, [onPlay]);

    const resumePlaybackIfNeeded = useCallback(() => {
        if (!autoResumeOnFullscreenExit) return;

        const shouldBePlaying = externalPlaying || playing;
        if (!shouldBePlaying) return;

        const mediaElement = playerRef.current?.getInternalPlayer() as HTMLMediaElement | null;
        if (!mediaElement || !mediaElement.paused) return;

        // Delay slightly because iOS may still be transitioning out of native fullscreen.
        setTimeout(() => {
            mediaElement.play()
                .then(() => {
                    setPlaying(true);
                })
                .catch((error) => {
                    console.debug("Auto-resume after fullscreen exit failed:", error);
                });
        }, 120);
    }, [autoResumeOnFullscreenExit, externalPlaying, playing, playerRef]);

    // Sync with external props
    useEffect(() => {
        setPlaying(externalPlaying);

        // Playback that nobody pressed play for still has to announce itself. A screen share is
        // live the moment it is captured, so it arrives here as externalPlaying=true and never
        // passes through togglePlay, the native-controls sync, or seek-resume — the three routes
        // that fire onPlay today. That silence is what stopped the watch timer: the host's onPlay
        // is what emits HOST_PLAYBACK_STATE{playing:true}, and RoomContext.captureWatchTime
        // reports watchTime only while hostPlayback.playing is set. A screen-sharing host was
        // therefore metered at zero minutes a day, while file and URL sources — which do go
        // through a play button — metered correctly.
        if (externalPlaying && !externalStartAnnouncedRef.current) {
            externalStartAnnouncedRef.current = true;
            onPlayRef.current?.("external");
        } else if (!externalPlaying) {
            externalStartAnnouncedRef.current = false;
        }
    }, [externalPlaying]);
    useEffect(() => setVolume(externalVolume), [externalVolume]);
    useEffect(() => setProgress(externalProgress), [externalProgress]);
    useEffect(() => setDuration(externalDuration), [externalDuration]);
    useEffect(() => setMuted(externalMuted), [externalMuted])

    /**
     * Re-attach a replaced MediaStream to the media element.
     *
     * ReactPlayer decides whether to reload by deep-comparing the old and new `url` with
     * react-fast-compare. Every property of a MediaStream lives on its prototype, so two
     * different streams compare as two empty objects — equal — and the element silently keeps
     * the first srcObject it was ever given. Verified against react-fast-compare 3.2.2:
     * `equal(streamA, streamB)` is true.
     *
     * A viewer only ever gets one attach out of that, and whatever arrived first is what they
     * watch forever. It is the reason a bad first stream — a set consumed while the host was
     * still producing, so audio only, or one whose producers died with the previous session —
     * shows as a permanently black player even though the corrected stream did arrive and the
     * consumers are healthy. Nothing in the console reports it: from useStream's side the
     * stream was handed over and accepted.
     */
    useEffect(() => {
        if (typeof MediaStream === "undefined" || !(url instanceof MediaStream)) return;

        const mediaElement = playerRef.current?.getInternalPlayer() as HTMLMediaElement | null;
        // Nothing mounted yet, or ReactPlayer already attached this exact stream on load.
        if (!mediaElement || mediaElement.srcObject === url) return;

        mediaElement.srcObject = url;
        if (externalPlaying || playing) {
            // Assigning srcObject resets the element, and ReactPlayer will not call play() for a
            // change it does not believe happened.
            mediaElement.play().catch((error) => {
                console.debug("[Player] Re-attached stream failed to play:", error);
            });
        }
    }, [url, externalPlaying, playing, playerRef]);
    useEffect(() => {
        playingRef.current = playing;
    }, [playing]);
    useEffect(() => {
        durationRef.current = duration;
    }, [duration]);
    // Controls visibility
    const startInactivityTimer = () => {
        if (isSeekingRef.current) return;
        clearTimeout(inactivityTimerRef.current!);
        inactivityTimerRef.current = setTimeout(() => {
            if (!isSeekingRef.current) {
                setShowControls(false);
            }
        }, 5000);
    };

    const isYouTubeSource = typeof url === "string" && /youtube\.com|youtu\.be/i.test(url);
    const showNativeControls = nativeControlsActive && isYouTubeSource;

    const clearNativeControlsTimer = () => {
        if (nativeControlsTimerRef.current) {
            clearTimeout(nativeControlsTimerRef.current);
            nativeControlsTimerRef.current = null;
        }
    };

    const resolveInternalPlayingState = () => {
        const internalPlayer = playerRef.current?.getInternalPlayer?.() as any;
        if (internalPlayer && typeof internalPlayer.getPlayerState === "function") {
            // YouTube IFrame API: 1 = playing, 2 = paused
            return internalPlayer.getPlayerState() === 1;
        }
        if (internalPlayer && typeof internalPlayer.paused === "boolean") {
            return !internalPlayer.paused;
        }
        return playing;
    };

    const syncAfterNativeControls = () => {
        if (!playerRef.current) return;
        if (disableControls.includes(ControlComponents.BROADCAST_SYNC)) {
            console.log("helloakjshdkljasghdjhkag")
            return syncWithHost?.()
        }
        const actualPlaying = resolveInternalPlayingState();
        if (actualPlaying !== playingRef.current) {
            setPlaying(actualPlaying);
            if (actualPlaying) onPlay?.("native-controls");
            else onPause?.("native-controls");
        }

        const currentTime = playerRef.current.getCurrentTime?.();
        const resolvedTime =
            typeof currentTime === "number" && isFinite(currentTime) ? currentTime : undefined;
        const currentDuration = durationRef.current;
        const seekPercent =
            resolvedTime !== undefined && currentDuration > 0 ? (resolvedTime / currentDuration) * 100 : undefined;
        onSeekEnd?.(resolvedTime, seekPercent);
    };

    const exitNativeControls = () => {
        clearNativeControlsTimer();
        setNativeControlsActive(false);
        if (controls) {
            setShowControls(true);
            startInactivityTimer();
        }
        syncAfterNativeControls();
    };

    const scheduleNativeControlsReset = () => {
        clearNativeControlsTimer();
        nativeControlsTimerRef.current = setTimeout(() => {
            exitNativeControls();
        }, 5000);
    };

    const handleUserActivity = () => {
        if (showNativeControls) {
            scheduleNativeControlsReset();
            return;
        }
        if (!showControls) setShowControls(true);
        startInactivityTimer();
    };

    const shouldShowUnmuteOverlay = !showNativeControls && muted && (!hasUserInteracted || isMobile);
    const showPlayerControls = controls && !shouldShowUnmuteOverlay && !showNativeControls;

    const handleUnmuteOverlayClick = useCallback(() => {
        setMuted(false);
        onMute?.(false);
        setVolume(1);
        onVolumeChange?.(1);
        if (!playing) {
            // setPlaying(true);
            onPlay?.("play");
        }
        handleUserActivity();
    }, [handleUserActivity, onMute, onPlay, onVolumeChange, playing]);

    // * Here we are managing the interaction basicallu to enable the mute or unmute stuff
    useEffect(() => {
        if (!shouldShowUnmuteOverlay) return;

        const handleGlobalInteraction = (event: Event) => {
            if ("isTrusted" in event && !event.isTrusted) return;
            handleUnmuteOverlayClick();
        };

        window.addEventListener("click", handleGlobalInteraction);
        window.addEventListener("touchstart", handleGlobalInteraction, { passive: true });
        window.addEventListener("keydown", handleGlobalInteraction);

        return () => {
            window.removeEventListener("click", handleGlobalInteraction);
            window.removeEventListener("touchstart", handleGlobalInteraction);
            window.removeEventListener("keydown", handleGlobalInteraction);
        };
    }, [handleUnmuteOverlayClick, shouldShowUnmuteOverlay]);
    useEffect(() => {
        if (controls && !showNativeControls) {
            startInactivityTimer();
            return () => clearTimeout(inactivityTimerRef.current!);
        }
    }, [controls, showNativeControls]);

    useEffect(() => {
        if (!isYouTubeSource && nativeControlsActive) {
            clearNativeControlsTimer();
            setNativeControlsActive(false);
        }
    }, [isYouTubeSource, nativeControlsActive]);

    useEffect(() => {
        return () => {
            if (nativeControlsTimerRef.current) {
                clearTimeout(nativeControlsTimerRef.current);
            }
        };
    }, []);

    // Player controls
    const isPlayDisabled = disableControls.includes(ControlComponents.PLAY);
    const togglePlay = () => {
        if (isPlayDisabled) return;
        const newPlaying = !playing;
        setPlaying(newPlaying);

        if (newPlaying) onPlay?.('play');
        else onPause?.('pause');

        if (controls) handleUserActivity();
    };

    const toggleMute = () => {
        if(disableControls.includes(ControlComponents.VOLUME)) return;
        const newMuted = !muted;
        setMuted(newMuted);
        onMute?.(newMuted);
        if (controls) handleUserActivity();
    };

    // const toggleFullscreen = () => {
    //     const targetElement = fullscreenTargetRef?.current || playerContainerRef.current;
    //     console.log(targetElement)
    //     if (screenfull.isEnabled && targetElement) {
    //         if (screenfull.isFullscreen) {
    //             screenfull.exit();
    //             setFullscreen(false);
    //         } else {
    //             screenfull.request(targetElement);
    //             setFullscreen(true);
    //         }
    //         const newFullscreen = !fullscreen;
    //         setFullscreen(newFullscreen);
    //         onFullscreenChange?.(newFullscreen);
    //     }
    //     if (controls) handleUserActivity();
    // };

    const handleOnHidingFullControls = () => {
        if (!isYouTubeSource) return;
        if (showNativeControls) {
            exitNativeControls();
            return;
        }
        if (inactivityTimerRef.current) {
            clearTimeout(inactivityTimerRef.current);
        }
        setShowControls(false);
        setNativeControlsActive(true);
        scheduleNativeControlsReset();
    }
    const toggleFullscreen = () => {
        if (disableControls.includes(ControlComponents.FULLSCREEN)) return;
        // For mobile browsers, use native video element fullscreen
        if (isMobile && playerRef.current) {
            const videoElement = playerRef.current.getInternalPlayer() as HTMLVideoElement | null;
            
            if (videoElement && videoElement instanceof HTMLVideoElement) {
                const iosVideo = videoElement as IOSVideoElement;
                // iOS Safari - use webkitEnterFullscreen
                if (iosVideo.webkitEnterFullscreen) {
                    try {
                        iosVideo.webkitEnterFullscreen();
                        setFullscreen(true);
                        onFullscreenChange?.(true);
                        if (controls) handleUserActivity();
                        return;
                    } catch (error) {
                        console.error('Failed to enter fullscreen on iOS:', error);
                    }
                }
                
                // Android/Chrome - use requestFullscreen on video element
                if (videoElement.requestFullscreen) {
                    // Check if already in fullscreen
                    const isCurrentlyFullscreen = !!(
                        document.fullscreenElement === videoElement ||
                        (document as any).webkitFullscreenElement === videoElement ||
                        (document as any).mozFullScreenElement === videoElement ||
                        (document as any).msFullscreenElement === videoElement
                    );
                    
                    if (isCurrentlyFullscreen) {
                        // Exit fullscreen
                        const exitFullscreen = 
                            document.exitFullscreen ||
                            (document as any).webkitExitFullscreen ||
                            (document as any).mozCancelFullScreen ||
                            (document as any).msExitFullscreen;
                        
                        if (exitFullscreen) {
                            exitFullscreen.call(document)
                                .then(() => {
                                    setFullscreen(false);
                                    onFullscreenChange?.(false);
                                })
                                .catch((error) => {
                                    console.error('Failed to exit fullscreen:', error);
                                });
                        }
                    } else {
                        // Enter fullscreen
                        videoElement.requestFullscreen()
                            .then(() => {
                                setFullscreen(true);
                                onFullscreenChange?.(true);
                            })
                            .catch((error) => {
                                console.error('Failed to enter fullscreen:', error);
                            });
                    }
                    if (controls) handleUserActivity();
                    return;
                }
            }
        }
        
        // Desktop browsers - use screenfull
        const targetRef = fullscreenTargetRef || playerContainerRef;

        if (screenfull.isEnabled && targetRef.current) {
            if (screenfull.isFullscreen) {
                screenfull.exit();
                setFullscreen(false);
            } else {
                screenfull.request(targetRef.current);
                setFullscreen(true);
            }

            const newFullscreen = !fullscreen;
            setFullscreen(newFullscreen);
            onFullscreenChange?.(newFullscreen);
        }

        if (controls) handleUserActivity();
    };

    const handleVolumeChange = (newVolume: number) => {
        setVolume(newVolume);
        setMuted(newVolume === 0);
        onVolumeChange?.(newVolume);
        if (controls) handleUserActivity();
    };

    // Progress and seeking
    const handleProgress = (state: { played: number; loaded: number }) => {
        if (!ignoreProgressRef.current) {
            setProgress(state.played * 100);
        }
        setBuffered(state.loaded * 100);
        onProgress?.();
    };

    const handleSeekStart = () => {
        if (disableControls.includes(ControlComponents.PROGRESS)) return;
        isSeekingRef.current = true;
        ignoreProgressRef.current = true;
        if (progressResumeRef.current) {
            clearTimeout(progressResumeRef.current);
            progressResumeRef.current = null;
        }
        if (controls) {
            if (!showControls) setShowControls(true);
            clearTimeout(inactivityTimerRef.current!);
        }

        wasPlayingBeforeSeek.current = playing;
        
        // Only pause on seek start if disableSeekPauseResume is false
        if (playing && !disableSeekPauseResume) {
            setPlaying(false);
            onPause?.('seekend');
        }
        
        onSeekStart?.();
    };

    const handleSeekTo = (percent: number) => {
        if (disableControls.includes(ControlComponents.PROGRESS)) return;
        if (!playerRef.current) return;
        const seekToTime = duration * (percent / 100);
        playerRef.current.seekTo(seekToTime, "seconds");
        setProgress(percent);
        onSeek?.(percent);
    };

    const handleSeekEnd = (seekTime?: number, seekPercent?: number) => {
        if (disableControls.includes(ControlComponents.PROGRESS)) return;
        if (seekDebounceRef.current) clearTimeout(seekDebounceRef.current);
        onSeekEnd?.(seekTime, seekPercent);
        isSeekingRef.current = false;
        if (controls) startInactivityTimer();
        progressResumeRef.current = setTimeout(() => {
            ignoreProgressRef.current = false;
            progressResumeRef.current = null;
        }, 250);
        
        // Only resume on seek end if disableSeekPauseResume is false
        if (!disableSeekPauseResume) {
            seekDebounceRef.current = setTimeout(() => {
                if (wasPlayingBeforeSeek.current) {
                    setPlaying(true);
                    onPlay?.('seekend');
                }
            }, 300);
        }
    };

    const handleDuration = (duration: number) => {
        setDuration(duration);
        onDuration?.(duration);
    };

    const onBufferEnd = () => {
        setIsBuffering(false);
    };

    const onBufferStart = () => {
        setIsBuffering(true);
    };


    // Listen for fullscreen changes on mobile devices
    useEffect(() => {
        if (!isMobile || !playerRef.current) return;

        const videoElement = playerRef.current.getInternalPlayer() as HTMLVideoElement | null;
        
        if (!videoElement || !(videoElement instanceof HTMLVideoElement)) return;

        const handleFullscreenChange = () => {
            // Check if video is in fullscreen
            const iosVideo = videoElement as IOSVideoElement;
            const isCurrentlyFullscreen = !!(
                document.fullscreenElement ||
                (document as any).webkitFullscreenElement ||
                (document as any).mozFullScreenElement ||
                (document as any).msFullscreenElement ||
                iosVideo.webkitDisplayingFullscreen
            );
            
            setFullscreen(isCurrentlyFullscreen);
            onFullscreenChange?.(isCurrentlyFullscreen);
        };

        // Listen to various fullscreen events
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.addEventListener('mozfullscreenchange', handleFullscreenChange);
        document.addEventListener('MSFullscreenChange', handleFullscreenChange);
        
        // iOS specific - listen for webkitbeginfullscreen and webkitendfullscreen
        const handleWebkitBeginFullscreen = () => {
            setFullscreen(true);
            onFullscreenChange?.(true);
        };
        
        const handleWebkitEndFullscreen = () => {
            setFullscreen(false);
            onFullscreenChange?.(false);
            resumePlaybackIfNeeded();
        };
        
        videoElement.addEventListener('webkitbeginfullscreen', handleWebkitBeginFullscreen);
        videoElement.addEventListener('webkitendfullscreen', handleWebkitEndFullscreen);

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
            document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
            document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
            videoElement.removeEventListener('webkitbeginfullscreen', handleWebkitBeginFullscreen);
            videoElement.removeEventListener('webkitendfullscreen', handleWebkitEndFullscreen);
        };
    }, [onFullscreenChange, playerRef, resumePlaybackIfNeeded]);

    return (
        // TODO: Need to check about the fullscreen if there is no external control for fullscreen
        <div
            // ref={playerContainerRef}
            className={`flex items-center justify-center h-full ${false ? "fixed inset-0 z-50 bg-black" : ""
                }`}
            onMouseMove={controls ? handleUserActivity : undefined}
            onMouseEnter={controls ? handleUserActivity : undefined}
            onTouchStart={controls ? handleUserActivity : undefined}
        >
            <div
                className={`${false ? "w-full h-full" : "h-full w-full"
                    } relative overflow-hidden shadow-2xl ${className}`}
            >
                <ReactPlayer
                    ref={playerRef as React.RefObject<ReactPlayer>}
                    url={url}
                    width={width || "100%"}
                    height={height || "100%"}
                    playing={playing}
                    controls={showNativeControls}
                    loop={loop}
                    muted={muted}
                    playsinline={true}
                    volume={volume}
                    onProgress={handleProgress}
                    onDuration={handleDuration}
                    onBuffer={onBufferStart}
                    onBufferEnd={onBufferEnd}
                    onClick={showNativeControls ? undefined : togglePlay}
                    onReady={onReady}
                    onEnded={onEnded}
                    onPause={() => {
                        // iOS can emit pause while collapsing native fullscreen for non-host consumers.
                        resumePlaybackIfNeeded();
                    }}
                    config={{
                        youtube: {
                            playerVars: {
                                controls: 1,
                                disablekb: 0,
                                cc_load_policy: 0,
                                modestbranding: 1,
                                showinfo: 1,
                                rel: 0
                            },
                        },
                    }}
                />

                {/* NOTE: UI Overlay component */}
                {!showNativeControls && children}

                {shouldShowUnmuteOverlay && (
                    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/30 backdrop-blur-sm">
                        <button
                            type="button"
                            onClick={handleUnmuteOverlayClick}
                            className="flex flex-col items-center gap-2 text-center text-white/90"
                            aria-label={isMobile ? "Tap to unmute" : "Click to unmute"}
                        >
                            <FaVolumeMute size={25}/>
                            <span className="text-sm font-semibold">
                                {isMobile ? "Tap to unmute" : "Click to unmute"}
                            </span>
                        </button>
                    </div>
                )}
                
                {/* Audio Visualizer - only show when there's no video track (audio-only content) */}
                {!showNativeControls && externalHasVideoTrack === false && (
                    <AudioVisualizer 
                        playing={playing} 
                        muted={muted} 
                        playerRef={playerRef}
                    />
                )}

                {!showNativeControls && !shouldShowUnmuteOverlay && !hideControls.includes(ControlComponents.OVERLAY) && (
                    <PlayPauseOverlay
                        playing={playing}
                        onToggle={togglePlay}
                        onDoubleClick={toggleFullscreen}
                        disablePlay={isPlayDisabled}
                    />
                )}

                {showPlayerControls && (
                    <ControlBar
                        showControls={showControls}
                        progress={progress}
                        buffered={buffered}
                        isBuffering={isBuffering}
                        playing={playing}
                        muted={muted}
                        volume={volume}
                        duration={duration}
                        fullscreen={fullscreen}
                        onSeekTo={handleSeekTo}
                        onSeekStart={handleSeekStart}
                        onSeekEnd={handleSeekEnd}
                        onPlayPause={togglePlay}
                        onMuteToggle={toggleMute}
                        onOpenStore={onOpenStore}
                        onVolumeChange={handleVolumeChange}
                        onFullscreenToggle={toggleFullscreen}
                        formatTime={formatVideoTime}
                        hideControls={hideControls}
                        onUserActivity={handleUserActivity}
                        onHidingFullControls={handleOnHidingFullControls}
                    />
                )}
            </div>
        </div>
    );
};

export default VideoPlayer;
