"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import { useFileContext } from "@/context/FileContext";
import { useMediaStreamContext } from "@/context/MediaStreamContext";
import { Player } from "@/components/VideoPlayer";
import PlayerOverlay from "@/components/Container/PlayerOverlay";
import type ReactPlayer from "react-player";
import { useMediaSoup } from "@/hooks/useMediaSoup";
import { helper } from "@/utils";

type Props = {
    fullscreenTargetRef?: React.RefObject<HTMLDivElement>;
};

const StreamPlayer = ({ fullscreenTargetRef }: Props) => {
    const roomState = useSelector((state: RootState) => state.room);
    const authState = useSelector((state: RootState) => state.auth);
    const { files } = useFileContext();
    const { stream: screenStream } = useMediaStreamContext();
    const playerRef = useRef<ReactPlayer>(null);
    const [videoReady, setVideoReady] = useState(false);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const [currentFileUrl, setCurrentFileUrl] = useState<string>("");
    const hasJoinedRef = useRef(false);
    const selectedIndexRef = useRef(roomState.selectedFileIndex);
    const isChangingVideoRef = useRef(false);
    const videoEndedRef = useRef(false); // Track if video has ended
    
    // Determine streaming mode from room state
    // Screen sharing: type is "stream" AND source is "stream" AND screenStream exists
    const isScreenSharing = roomState.type === "stream" && 
                           roomState.source === "stream" && 
                           screenStream !== null;
    
    // File streaming: type is "stream" AND source is "file"
    const isFileStreaming = roomState.type === "stream" && 
                           roomState.source === "file";
    
    // Pause overlay state (for consumers)
    const [isPaused, setIsPaused] = useState(false);
    const [pauseFrameUrl, setPauseFrameUrl] = useState<string | null>(null);
    const [isFrameFading, setIsFrameFading] = useState(false);
    const videoElementRef = useRef<HTMLVideoElement | null>(null);
    const [hasVideoTrack, setHasVideoTrack] = useState<boolean | undefined>(true); // Default to true (hide visualizer)
    const delayTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Keep selectedIndexRef in sync
    useEffect(() => {
        selectedIndexRef.current = roomState.selectedFileIndex;
    }, [roomState.selectedFileIndex]);

    // Get stream from player (for host to produce)
    // For screen sharing: returns the screen stream from MediaStreamContext
    // For file streaming: captures stream from video element
    const getStream = useCallback((): MediaStream | null => {
        // If screen sharing, return the screen stream from context
        if (isScreenSharing && screenStream) {
            const videoTracks = screenStream.getVideoTracks();
            const audioTracks = screenStream.getAudioTracks();
            const hasVideo = videoTracks.length > 0;
            
            // Check if any tracks have ended
            const endedVideoTracks = videoTracks.filter(t => t.readyState === 'ended');
            const endedAudioTracks = audioTracks.filter(t => t.readyState === 'ended');
            
            if (endedVideoTracks.length > 0 || endedAudioTracks.length > 0) {
                console.warn("StreamPlayer - getStream (screen): Some tracks have ended:", {
                    endedVideo: endedVideoTracks.length,
                    endedAudio: endedAudioTracks.length,
                    totalVideo: videoTracks.length,
                    totalAudio: audioTracks.length
                });
                // Don't return stream if all tracks are ended
                if (videoTracks.length === endedVideoTracks.length && audioTracks.length === endedAudioTracks.length) {
                    console.error("StreamPlayer - getStream (screen): All tracks have ended, cannot produce");
                    return null;
                }
            }
            
            // Ensure all active tracks are enabled
            videoTracks.forEach(track => {
                if (track.readyState === 'live' && !track.enabled) {
                    track.enabled = true;
                }
            });
            audioTracks.forEach(track => {
                if (track.readyState === 'live' && !track.enabled) {
                    track.enabled = true;
                }
            });
            
            console.log("StreamPlayer - getStream (screen): screen stream with tracks:", {
                streamId: screenStream.id,
                video: videoTracks.length,
                audio: audioTracks.length,
                hasVideo,
                videoTracksLive: videoTracks.filter(t => t.readyState === 'live').length,
                audioTracksLive: audioTracks.filter(t => t.readyState === 'live').length
            });
            
            // Update hasVideoTrack state
            if (delayTimerRef.current) {
                clearTimeout(delayTimerRef.current);
            }
            if (hasVideo) {
                setHasVideoTrack(true);
            } else {
                delayTimerRef.current = setTimeout(() => {
                    setHasVideoTrack(false);
                }, 100);
            }
            
            return screenStream;
        }
        
        // File streaming: capture stream from video element
        if (!playerRef.current) {
            console.log("StreamPlayer - getStream (file): no playerRef");
            return null;
        }
        const videoElement = playerRef.current.getInternalPlayer() as (HTMLVideoElement & { 
            captureStream?: () => MediaStream;
            mozCaptureStream?: () => MediaStream;
        });
        if (!videoElement) {
            console.log("StreamPlayer - getStream (file): no videoElement");
            return null;
        }
        
        // Store reference to video element for frame capture
        videoElementRef.current = videoElement;
        
        // Try captureStream (Chrome/Edge/Safari)
        let stream: MediaStream | null = null;
        if (videoElement.captureStream) {
            try {
                stream = videoElement.captureStream();
                console.log("StreamPlayer - getStream (file): Using captureStream()");
            } catch (error) {
                console.warn("StreamPlayer - getStream (file): captureStream() failed:", error);
            }
        }
        
        // Fallback for Firefox: use mozCaptureStream (older Firefox) or canvas-based approach
        if (!stream) {
            if (videoElement.mozCaptureStream) {
                try {
                    stream = videoElement.mozCaptureStream();
                    console.log("StreamPlayer - getStream (file): Using mozCaptureStream()");
                } catch (error) {
                    console.warn("StreamPlayer - getStream (file): mozCaptureStream() failed:", error);
                }
            }
        }
        
        // Final fallback: Use canvas to capture video frames (works in Firefox)
        if (!stream) {
            stream = helper.captureStreamFromVideo(videoElement);
            if (stream) {
                console.log("StreamPlayer - getStream (file): Using canvas fallback for Firefox");
            }
        }
        
        if (!stream) {
            console.error("StreamPlayer - getStream (file): All capture methods failed - browser may not support video capture");
            return null;
        }
        const videoTracks = stream.getVideoTracks();
        const hasVideo = videoTracks.length > 0;
        
        console.log("StreamPlayer - getStream (file): captured stream with tracks:", {
            video: videoTracks.length,
            audio: stream.getAudioTracks().length,
            hasVideo
        });
        
        // Update hasVideoTrack state for host with delay to prevent flash
        if (delayTimerRef.current) {
            clearTimeout(delayTimerRef.current);
        }
        if (hasVideo) {
            setHasVideoTrack(true); // Immediately hide visualizer if video detected
        } else {
            // Delay 100ms before showing visualizer (audio-only)
            delayTimerRef.current = setTimeout(() => {
                setHasVideoTrack(false);
            }, 100);
        }
        
        return stream;
    }, [isScreenSharing, screenStream]);

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
        const videoTracks = stream.getVideoTracks();
        const hasVideo = videoTracks.length > 0;
        
        console.log("handleStreamReceived: Received new stream from host", {
            id: stream.id,
            videoTracks: videoTracks.length,
            audioTracks: stream.getAudioTracks().length,
            active: stream.active,
            hasVideo
        });
        
        // Update hasVideoTrack state for consumer with delay to prevent flash
        if (delayTimerRef.current) {
            clearTimeout(delayTimerRef.current);
        }
        if (hasVideo) {
            setHasVideoTrack(true); // Immediately hide visualizer if video detected
        } else {
            // Delay 100ms before showing visualizer (audio-only)
            delayTimerRef.current = setTimeout(() => {
                setHasVideoTrack(false);
            }, 100);
        }
        
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

    // Create object URL for current file (host only, and only for file streaming)
    useEffect(() => {
        if (!roomState.host || !isFileStreaming) return; // Only for file streaming, skip for screen sharing
        
        const file = files[roomState.selectedFileIndex];
        if (!file) return;
        
        console.log("Creating URL for file:", file.name, "index:", roomState.selectedFileIndex);
        
        // Mark that we're changing video
        isChangingVideoRef.current = true;
        
        // Reset hasVideoTrack to hide visualizer immediately on URL change
        if (delayTimerRef.current) {
            clearTimeout(delayTimerRef.current);
        }
        setHasVideoTrack(true); // Hide visualizer immediately
        
        // Create new URL for the selected file
        const url = URL.createObjectURL(file);
        setCurrentFileUrl(url);
        setVideoReady(false); // Reset ready state for new video
        
        return () => {
            console.log("Revoking URL for:", file.name);
            URL.revokeObjectURL(url);
            if (delayTimerRef.current) {
                clearTimeout(delayTimerRef.current);
            }
        };
    }, [files, roomState.selectedFileIndex, roomState.host, isFileStreaming]);

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
        
        // Check video dimensions for host (to detect audio-only files)
        if (roomState.host && playerRef.current) {
            const videoElement = playerRef.current.getInternalPlayer() as HTMLVideoElement | null;
            if (videoElement) {
                const hasVideo = videoElement.videoWidth > 0 && videoElement.videoHeight > 0;
                
                // Update with delay to prevent flash
                if (delayTimerRef.current) {
                    clearTimeout(delayTimerRef.current);
                }
                if (hasVideo) {
                    setHasVideoTrack(true); // Immediately hide visualizer if video detected
                } else {
                    // Delay 100ms before showing visualizer (audio-only)
                    delayTimerRef.current = setTimeout(() => {
                        setHasVideoTrack(false);
                    }, 100);
                }
                
                console.log("Video ready - dimensions:", {
                    width: videoElement.videoWidth,
                    height: videoElement.videoHeight,
                    hasVideo
                });
            }
        }
        
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
            if (roomState.host && !hasJoinedRef.current) {
                // For screen sharing: join when stream is available
                if (isScreenSharing) {
                    if (screenStream) {
                        const videoTracks = screenStream.getVideoTracks();
                        const audioTracks = screenStream.getAudioTracks();
                        const hasActiveTracks = 
                            videoTracks.some(t => t.readyState === 'live') || 
                            audioTracks.some(t => t.readyState === 'live');
                        
                        if (hasActiveTracks) {
                            console.log('StreamPlayer - Joining room (screen share):', { 
                                streamId: screenStream.id,
                                videoTracks: videoTracks.length,
                                audioTracks: audioTracks.length
                            });
                            joinRoom(roomState.roomId, roomState.host, authState.user?.username!);
                            hasJoinedRef.current = true;
                            isChangingVideoRef.current = false;
                        } else {
                            console.log('StreamPlayer - Waiting for active screen stream tracks...');
                        }
                    } else {
                        console.log('StreamPlayer - Waiting for screen stream...');
                    }
                } else {
                    // For file streaming: join when first video is ready
                    if (videoReady) {
                        console.log('StreamPlayer - Joining room (file):', { videoReady });
                        joinRoom(roomState.roomId, roomState.host, authState.user?.username!);
                        hasJoinedRef.current = true;
                        isChangingVideoRef.current = false;
                    }
                }
            } else if (!roomState.host && !hasJoinedRef.current) {
                // Consumer: join immediately
                console.log('StreamPlayer - Joining room (consumer)');
                joinRoom(roomState.roomId, roomState.host, authState.user?.username!);
                hasJoinedRef.current = true;
            }
        }
    }, [authState.isAuthenticated, roomState.roomId, roomState.host, videoReady, isConnected, joinRoom, authState.user?.username, isScreenSharing, screenStream]);

    // Determine video source
    // For screen sharing: use screen stream (host) or remote stream (consumer)
    // For file streaming: use file URL (host) or remote stream (consumer)
    const source = roomState.host 
        ? (isScreenSharing ? screenStream : currentFileUrl)
        : remoteStream;
    
    // Log when source changes for debugging
    useEffect(() => {
        if (!roomState.host && remoteStream) {
            console.log("StreamPlayer: Consumer source updated", {
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
                        {roomState.host 
                            ? (isScreenSharing ? "📺 Waiting for screen share..." : "🎬 Loading video...")
                            : "📡 Waiting for stream..."}
                    </div>
                    <div className="text-sm text-white/40">
                        {roomState.host 
                            ? (isScreenSharing ? "Please start screen sharing" : "Preparing to stream")
                            : "Host is setting up"}
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
    // For host: screen sharing always plays, file streaming uses player state
    const isPlaying = roomState.host 
        ? (isScreenSharing ? true : false) // Screen sharing always plays
        : !isPaused; // Consumer pauses when host pauses

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
                muted={false} // Mute host to avoid echo
                onPlay={onPlay}
                onPause={onPause}
                hasVideoTrack={hasVideoTrack}
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

export default StreamPlayer;
