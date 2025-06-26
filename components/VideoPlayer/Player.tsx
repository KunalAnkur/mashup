"use client"
import { useState, useRef, useEffect, ReactNode } from "react";
import ReactPlayer from "react-player";
import screenfull from "screenfull";
import { PlayPauseOverlay } from "@/components/VideoPlayer/PlayPauseOverlay";
import { ControlBar } from "@/components/VideoPlayer/ControlBar";
import { SourceProps } from "react-player/base";
import { FileConfig } from "react-player/file";
export enum ControlComponents {
    PLAY = 'play',
    VOLUME = 'volume',
    PROGRESS = 'progress',
    DURATION = 'duration',
    OVERLAY = 'overlay',
    FULLSCREEN = 'fullscreen'
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
    onSeekEnd?: () => void;
    onDuration?: (duration: number) => void;
    onFullscreenChange?: (isFullscreen: boolean) => void;
    onReady?: () => void;
    playerRef?: React.RefObject<ReactPlayer | null>;
    controls?: boolean;
    loop?: boolean;
    fullscreenTargetRef?: React.RefObject<HTMLElement>;
    children?: ReactNode;
    className?: string;
    FileConfig?: FileConfig;
    disableControls?: ControlComponents[];
    hideControls?: ControlComponents[];
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
    onFullscreenChange,
    controls = true,
    loop = false,
    playerRef: externalPlayerRef,
    fullscreenTargetRef,
    className,
    width,
    height,
    disableControls = [],
    hideControls = [],
    children
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

    // Refs
    const internalPlayerRef = useRef<ReactPlayer>(null);
    const playerRef = externalPlayerRef || internalPlayerRef;
    const playerContainerRef = useRef<HTMLDivElement>(null);
    const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
    const seekDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const wasPlayingBeforeSeek = useRef(false);

    // Sync with external props
    useEffect(() => setPlaying(externalPlaying), [externalPlaying]);
    useEffect(() => setMuted(externalMuted), [externalMuted]);
    useEffect(() => setVolume(externalVolume), [externalVolume]);
    useEffect(() => setProgress(externalProgress), [externalProgress]);
    useEffect(() => setDuration(externalDuration), [externalDuration]);

    // Controls visibility
    const startInactivityTimer = () => {
        clearTimeout(inactivityTimerRef.current!);
        inactivityTimerRef.current = setTimeout(() => setShowControls(false), 3000);
    };

    const handleUserActivity = () => {
        if (!showControls) setShowControls(true);
        startInactivityTimer();
    };

    useEffect(() => {
        if (controls) {
            startInactivityTimer();
            return () => clearTimeout(inactivityTimerRef.current!);
        }
    }, [controls]);

    // Player controls
    const togglePlay = () => {
        if (disableControls.includes(ControlComponents.PLAY)) return;
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

    const toggleFullscreen = () => {
        if (disableControls.includes(ControlComponents.FULLSCREEN)) return;
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
        setProgress(state.played * 100);
        setBuffered(state.loaded * 100);
    };

    const handleSeekStart = () => {
        if (disableControls.includes(ControlComponents.PROGRESS)) return;
        wasPlayingBeforeSeek.current = playing;
        if (playing) {
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

    const handleSeekEnd = () => {
        if (disableControls.includes(ControlComponents.PROGRESS)) return;
        if (seekDebounceRef.current) clearTimeout(seekDebounceRef.current);
        onSeekEnd?.();
        seekDebounceRef.current = setTimeout(() => {
            if (wasPlayingBeforeSeek.current) {
                setPlaying(true);
                onPlay?.('seekend');
            }
        }, 300);
    };

    const handleDuration = (duration: number) => {
        setDuration(duration);
        onDuration?.(duration);
    };

    const formatTime = (seconds: number): string => {
        const date = new Date(seconds * 1000);
        const hh = date.getUTCHours();
        const mm = date.getUTCMinutes();
        const ss = date.getUTCSeconds().toString().padStart(2, "0");
        return hh ? `${hh}:${mm.toString().padStart(2, "0")}:${ss}` : `${mm}:${ss}`;
    };

    const onBufferEnd = () => {
        setIsBuffering(false);
    };

    return (
        // TODO: Need to check about the fullscreen if there is no external control for fullscreen
        <div
            // ref={playerContainerRef}
            className={`flex items-center justify-center h-full ${false ? "fixed inset-0 z-50 bg-black" : ""
                }`}
            onMouseMove={controls ? handleUserActivity : undefined}
            onMouseEnter={controls ? handleUserActivity : undefined}
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
                    loop={loop}
                    muted={muted}
                    volume={volume}
                    onProgress={handleProgress}
                    onDuration={handleDuration}
                    onBuffer={() => setIsBuffering(true)}
                    onBufferEnd={onBufferEnd}
                    onClick={togglePlay}
                    onReady={onReady}
                    config={{
                        youtube: {
                            playerVars: {
                                controls: 0,
                                disablekb: 0,
                                modestbranding: 0,
                                showinfo: 0,
                            },
                        },
                    }}
                />

                {/* NOTE: UI Overlay component */}
                {children}
                

                {!hideControls.includes(ControlComponents.OVERLAY) && <PlayPauseOverlay playing={playing} onToggle={togglePlay} onDoubleClick={toggleFullscreen} />}

                {controls && (
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
                        onVolumeChange={handleVolumeChange}
                        onFullscreenToggle={toggleFullscreen}
                        formatTime={formatTime}
                        hideControls={hideControls}
                    />
                )}
            </div>
        </div>
    );
};

export default VideoPlayer;