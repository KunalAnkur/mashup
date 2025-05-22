"use client"
import { useState, useRef, useEffect } from "react";
import ReactPlayer from "react-player";
import screenfull from "screenfull";
import { PlayPauseOverlay } from "@/components/VideoPlayer/PlayPauseOverlay";
import { ControlBar } from "@/components/VideoPlayer/ControlBar";
type VideoPlayerProps = {
    url: string | string[]
    playing?: boolean;
    muted?: boolean;
    volume?: number;
    progress?: number;
    duration?: number;
    onPlay?: (event: string) => void;
    onPause?: (event: string) => void;
    onVolumeChange?: (volume: number) => void;
    onMute?: (muted: boolean) => void;
    onSeek?: (progress: number) => void;
    onSeekStart?: () => void;
    onSeekEnd?: () => void;
    onDuration?: (duration: number) => void;
    onFullscreenChange?: (isFullscreen: boolean) => void;
    playerRef?: React.RefObject<ReactPlayer | null>;
    controls?: boolean;
    loop?: boolean;
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
    onFullscreenChange,
    controls = true,
    loop = false,
    playerRef: externalPlayerRef,
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
        const newPlaying = !playing;
        setPlaying(newPlaying);

        if (newPlaying) onPlay?.('play');
        else onPause?.('pause');

        if (controls) handleUserActivity();
    };

    const toggleMute = () => {
        const newMuted = !muted;
        setMuted(newMuted);
        onMute?.(newMuted);
        if (controls) handleUserActivity();
    };

    const toggleFullscreen = () => {
        if (screenfull.isEnabled && playerContainerRef.current) {
            if (screenfull.isFullscreen) {
                screenfull.exit();
                setFullscreen(false);
            } else {
                screenfull.request(playerContainerRef.current);
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
        wasPlayingBeforeSeek.current = playing;
        if (playing) {
            setPlaying(false);
            onPause?.('seekend');
        }
        onSeekStart?.();
    };

    const handleSeekTo = (percent: number) => {
        if (!playerRef.current) return;
        const seekToTime = duration * (percent / 100);
        playerRef.current.seekTo(seekToTime, "seconds");
        setProgress(percent);
        onSeek?.(percent);
    };

    const handleSeekEnd = () => {
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
        <div
            ref={playerContainerRef}
            className={`flex items-center justify-center ${fullscreen ? "fixed inset-0 z-50 bg-black" : ""
                }`}
            onMouseMove={controls ? handleUserActivity : undefined}
            onMouseEnter={controls ? handleUserActivity : undefined}
        >
            <div
                className={`${fullscreen ? "w-full h-full" : "h-[50vh] min-w-[50vw] w-full"
                    } relative overflow-hidden rounded-2xl shadow-2xl`}
            >
                <ReactPlayer
                    ref={playerRef as React.RefObject<ReactPlayer>}
                    url={url}
                    width="100%"
                    height="100%"
                    playing={playing}
                    loop={loop}
                    muted={muted}
                    volume={volume}
                    onProgress={handleProgress}
                    onDuration={handleDuration}
                    onBuffer={() => setIsBuffering(true)}
                    onBufferEnd={onBufferEnd}
                    onClick={togglePlay}
                    config={{
                        youtube: {
                            playerVars: {
                                controls: 0,
                                disablekb: 0,
                                modestbranding: 0,
                                showinfo: 0,
                            },
                        }
                    }}
                />

                <PlayPauseOverlay playing={playing} onToggle={togglePlay} onDoubleClick={toggleFullscreen} />

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
                    />
                )}
            </div>
        </div>
    );
};

export default VideoPlayer;