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
        
        const stream = videoElement.captureStream();
        console.log("getStream: captured stream with tracks:", {
            video: stream.getVideoTracks().length,
            audio: stream.getAudioTracks().length
        });
        return stream;
    }, []);

    // Handle received stream (for consumers)
    const handleStreamReceived = useCallback((stream: MediaStream) => {
        console.log("Received new stream from host");
        setRemoteStream(stream);
    }, []);

    const { 
        joinRoom, 
        isConnected, 
        onPause, 
        onPlay, 
        onSeekStart,
        onSeekEnd,
        replaceProducerTracks 
    } = useMediaSoup({ 
        getStream,
        onStreamReceived: handleStreamReceived,
        isHost: roomState.host,
        namespace: 'filestream'
    });

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
            }, 800); // Longer delay to ensure video is fully loaded and playing
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

    return (
        <Player
            playerRef={playerRef}
            playing={true} // Always play - needed for captureStream() to work
            onReady={handleVideoReady}
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
    );
};

export default FileStreamPlayer;
