"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import { useFileContext } from "@/context/FileContext";
import { Player } from "@/components/VideoPlayer";
import PlayerOverlay from "@/components/Container/PlayerOverlay";
import type ReactPlayer from "react-player";
import { useMediaSoup } from "@/hooks/useMediaSoup";
import { helper } from "@/utils";

type Props = {
    fullscreenTargetRef?: React.RefObject<HTMLDivElement>;
};

const FileStreamPlayer = ({ fullscreenTargetRef }: Props) => {
    const roomState = useSelector((state: RootState) => state.room);
    const authState = useSelector((state: RootState) => state.auth);
    const { files } = useFileContext();
    const playerRef = useRef<ReactPlayer>(null);
    const [videoReady, setVideoReady] = useState(false);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const [currentFileUrl, setCurrentFileUrl] = useState<string>("");
    const hasJoinedRef = useRef(false);
    const selectedIndexRef = useRef(roomState.selectedFileIndex);
    const isChangingVideoRef = useRef(false);
    const videoEndedRef = useRef(false); // Track if video has ended
    
    // Pause overlay state (for consumers)
    const [isPaused, setIsPaused] = useState(false);
    const [pauseFrameUrl, setPauseFrameUrl] = useState<string | null>(null);
    const [isFrameFading, setIsFrameFading] = useState(false);
    const videoElementRef = useRef<HTMLVideoElement | null>(null);

    // Keep selectedIndexRef in sync
    useEffect(() => {
        selectedIndexRef.current = roomState.selectedFileIndex;
    }, [roomState.selectedFileIndex]);

    // Get stream from player (for host to produce)
    const getStream = useCallback((): MediaStream | null => {
        if (!playerRef.current) {
            console.log("getStream: no playerRef");
            return null;
        }
        const videoElement = playerRef.current.getInternalPlayer() as (HTMLVideoElement & { captureStream?: () => MediaStream });
        if (!videoElement) {
            console.log("getStream: no videoElement");
            return null;
        }
        if (!videoElement.captureStream) {
            console.log("getStream: captureStream not supported");
            return null;
        }
        
        // Store reference to video element for frame capture
        videoElementRef.current = videoElement;
        
        const stream = videoElement.captureStream();
        console.log("getStream: captured stream with tracks:", {
            video: stream.getVideoTracks().length,
            audio: stream.getAudioTracks().length
        });
        return stream;
    }, []);

    // Capture current video frame as image
    const captureFrame = useCallback(() => {
        // For consumers, the source is a MediaStream, so we need to get the video element
        const videoElement = playerRef.current?.getInternalPlayer() as HTMLVideoElement | null;
        if (!videoElement) {
            console.log("captureFrame: No video element available");
            return null;
        }
        
        try {
            const canvas = document.createElement('canvas');
            canvas.width = videoElement.videoWidth || 1920;
            canvas.height = videoElement.videoHeight || 1080;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
                return canvas.toDataURL('image/jpeg', 0.8);
            }
        } catch (error) {
            console.error("captureFrame: Error capturing frame:", error);
        }
        return null;
    }, []);

    // Handle received stream (for consumers)
    const handleStreamReceived = useCallback((stream: MediaStream) => {
        console.log("handleStreamReceived: Received new stream from host", {
            id: stream.id,
            videoTracks: stream.getVideoTracks().length,
            audioTracks: stream.getAudioTracks().length,
            active: stream.active
        });
        
        // Clear pause state when receiving new stream
        setIsPaused(false);
        setPauseFrameUrl(null);
        
        setRemoteStream(stream);
    }, []);

    // Handle stream paused event (for consumers)
    const handleStreamPaused = useCallback(() => {
        console.log("handleStreamPaused: Host paused the stream");
        
        // Capture the current frame before it goes black
        const frameUrl = captureFrame();
        if (frameUrl) {
            setPauseFrameUrl(frameUrl);
        }
        setIsPaused(true);
    }, [captureFrame]);

    // Handle stream resumed event (for consumers)
    const handleStreamResumed = useCallback(() => {
        console.log("handleStreamResumed: Host resumed the stream");
        setIsPaused(false);
        
        // Wait for video stream to start showing frames, then fade out the frozen frame
        setTimeout(() => {
            setIsFrameFading(true); // Start fade out
            // Remove frame after fade animation completes
            setTimeout(() => {
                setPauseFrameUrl(null);
                setIsFrameFading(false);
            }, 300); // Match CSS transition duration
        }, 800); // Wait for stream to start
    }, []);

    const { 
        joinRoom, 
        isConnected, 
        onPause, 
        onPlay: mediaSoupOnPlay, 
        onSeekStart,
        onSeekEnd,
        replaceProducerTracks 
    } = useMediaSoup({ 
        getStream,
        onStreamReceived: handleStreamReceived,
        onStreamPaused: handleStreamPaused,
        onStreamResumed: handleStreamResumed,
        isHost: roomState.host,
        namespace: 'filestream'
    });

    // Wrap onPlay to handle video restart after ending
    const onPlay = useCallback((event: string) => {
        // Call the original handler
        mediaSoupOnPlay(event);
        
        // If video is playing after it ended, refresh producer tracks
        if (roomState.host && videoEndedRef.current && hasJoinedRef.current) {
            console.log("Video playing after end - refreshing producer tracks");
            videoEndedRef.current = false;
            
            setTimeout(async () => {
                const newStream = getStream();
                if (newStream) {
                    try {
                        await replaceProducerTracks(newStream);
                        console.log("Producer tracks refreshed after video restart");
                    } catch (error) {
                        console.error("Error refreshing producer tracks:", error);
                    }
                }
            }, 500);
        }
    }, [mediaSoupOnPlay, roomState.host, getStream, replaceProducerTracks]);

    // Create object URL for current file (host only)
    useEffect(() => {
        if (!roomState.host) return;
        
        const file = files[roomState.selectedFileIndex];
        if (!file) return;
        
        console.log("Creating URL for file:", file.name, "index:", roomState.selectedFileIndex);
        
        // Mark that we're changing video
        isChangingVideoRef.current = true;
        
        // Create new URL for the selected file
        const url = URL.createObjectURL(file);
        setCurrentFileUrl(url);
        setVideoReady(false); // Reset ready state for new video
        
        return () => {
            console.log("Revoking URL for:", file.name);
            URL.revokeObjectURL(url);
        };
    }, [files, roomState.selectedFileIndex, roomState.host]);

    // Handle video ended event (for host)
    const handleVideoEnded = useCallback(() => {
        if (!roomState.host) return;
        console.log("Video ended - marking for track refresh on next play");
        videoEndedRef.current = true;
    }, [roomState.host]);

    // Handle video ready event
    const handleVideoReady = useCallback(() => {
        console.log("Video ready for index:", selectedIndexRef.current);
        setVideoReady(true);
        
        // If we're changing video (not first load) and already joined, replace producers
        if (roomState.host && hasJoinedRef.current && isChangingVideoRef.current) {
            console.log("Video changed after join, scheduling producer replacement...");
            
            // Give the video more time to start playing and generate frames
            setTimeout(async () => {
                const newStream = getStream();
                if (!newStream) {
                    console.error("Failed to get stream from player - retrying in 500ms");
                    // Retry once more after delay
                    setTimeout(async () => {
                        const retryStream = getStream();
                        if (retryStream) {
                            console.log("Retry successful, replacing tracks...");
                            try {
                                await replaceProducerTracks(retryStream);
                                console.log("Producer tracks replaced successfully");
                            } catch (error) {
                                console.error("Error replacing producer tracks:", error);
                            }
                        } else {
                            console.error("Retry also failed to get stream");
                        }
                    }, 500);
                    return;
                }
                
                console.log("Got new stream, replacing tracks...");
                try {
                    await replaceProducerTracks(newStream);
                    console.log("Producer tracks replaced successfully");
                } catch (error) {
                    console.error("Error replacing producer tracks:", error);
                }
            }, 800);
        }
        
        // Reset the changing flag
        isChangingVideoRef.current = false;
    }, [roomState.host, getStream, replaceProducerTracks]);

    // Join room when ready
    useEffect(() => {
        if (authState.isAuthenticated && roomState.roomId && isConnected) {
            // Host: join when first video is ready
            // Consumer: join immediately (no video to load)
            if ((videoReady && roomState.host && !hasJoinedRef.current) || 
                (!roomState.host && !hasJoinedRef.current)) {
                console.log('Joining room:', { videoReady, host: roomState.host });
                joinRoom(roomState.roomId, roomState.host, authState.user?.username!);
                hasJoinedRef.current = true;
                // After first join, mark as no longer "changing" video
                isChangingVideoRef.current = false;
            }
        }
    }, [authState.isAuthenticated, roomState.roomId, roomState.host, videoReady, isConnected, joinRoom, authState.user?.username]);

    // Determine video source
    const source = roomState.host ? currentFileUrl : remoteStream;
    
    // Log when source changes for debugging
    useEffect(() => {
        if (!roomState.host && remoteStream) {
            console.log("FileStreamPlayer: Consumer source updated", {
                streamId: remoteStream.id,
                active: remoteStream.active,
                videoTracks: remoteStream.getVideoTracks().length
            });
        }
    }, [remoteStream, roomState.host]);

    // Don't render until we have a source
    if (!source) {
        return (
            <div className="flex items-center justify-center h-full bg-black">
                <div className="text-white/60 text-center">
                    <div className="animate-pulse mb-2">
                        {roomState.host ? "🎬 Loading video..." : "📡 Waiting for stream..."}
                    </div>
                    <div className="text-sm text-white/40">
                        {roomState.host ? "Preparing to stream" : "Host is setting up"}
                    </div>
                </div>
            </div>
        );
    }

    // Generate a key for the Player based on stream/url to force re-render
    const playerKey = roomState.host 
        ? `host-${roomState.selectedFileIndex}` 
        : remoteStream ? `consumer-${remoteStream.id}` : 'consumer-waiting';

    // For consumers: when host pauses, set playing to false to show natural player pause UI
    const isPlaying = roomState.host ? true : !isPaused;

    return (
        <div className="relative w-full h-full">
            <Player
                key={playerKey}
                playerRef={playerRef}
                playing={isPlaying} // Host always plays; consumer pauses when host pauses
                onReady={handleVideoReady}
                onEnded={handleVideoEnded}
                onSeekStart={onSeekStart}
                onSeekEnd={onSeekEnd}
                fullscreenTargetRef={fullscreenTargetRef}
                url={source}
                muted={roomState.host} // Mute host to avoid echo
                onPlay={onPlay}
                onPause={onPause}
                disableControls={helper.getPlayerControlsConfig(source, roomState.host).disableControls}
                hideControls={helper.getPlayerControlsConfig(source, roomState.host).hideControls}
            >
                <PlayerOverlay />
            </Player>
            
            {/* Frozen frame overlay for consumers - shows behind controls to prevent black screen */}
            {!roomState.host && pauseFrameUrl && (
                <div 
                    className={`absolute inset-0 z-0 pointer-events-none transition-opacity duration-300 ${
                        isFrameFading ? 'opacity-0' : 'opacity-100'
                    }`}
                >
                    <img 
                        src={pauseFrameUrl} 
                        alt="Paused" 
                        className="w-full h-full object-contain bg-black"
                    />
                </div>
            )}
        </div>
    );
};

export default FileStreamPlayer;
