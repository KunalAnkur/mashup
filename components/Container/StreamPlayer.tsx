"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import { useFileContext } from "@/context/FileContext";
import { useMediaStreamContext } from "@/context/MediaStreamContext";
import { Player } from "@/components/VideoPlayer";
import PlayerOverlay from "@/components/Container/PlayerOverlay";
import StreamPlayerEmptyState from "@/components/Container/StreamPlayerEmptyState";
import type ReactPlayer from "react-player";
import { useStream } from "@/hooks";
import { useRoomContext, RoomType } from "@/context/RoomContext";
import { helper } from "@/utils";
import { showError } from "@/utils/toast";

type Props = {
    fullscreenTargetRef?: React.RefObject<HTMLDivElement>;
};

const StreamPlayer = ({ fullscreenTargetRef }: Props) => {
    const roomState = useSelector((state: RootState) => state.room);
    const authState = useSelector((state: RootState) => state.auth);
    const { files } = useFileContext();
    const { stream: screenStream } = useMediaStreamContext();
    const playerRef = useRef<ReactPlayer>(null);

    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const [currentFileUrl, setCurrentFileUrl] = useState("");
    const [hasVideoTrack, setHasVideoTrack] = useState(true);
    const [isPaused, setIsPaused] = useState(false);
    const [pauseFrameUrl, setPauseFrameUrl] = useState<string | null>(null);

    const hasInitializedRef = useRef(false);
    const lastVideoIndexRef = useRef(-1);
    const videoEndedRef = useRef(false);
    const lastRoomTypeRef = useRef<RoomType | null>(null);
    const { isJoined, roomType, joinResponse, isHost, hostLeft } = useRoomContext();
    
    // Reset initialization when room type changes
    useEffect(() => {
        if (lastRoomTypeRef.current !== null && lastRoomTypeRef.current !== roomType) {
            console.log(`[StreamPlayer] Room type changed from ${lastRoomTypeRef.current} to ${roomType} - resetting initialization`);
            hasInitializedRef.current = false;
        }
        lastRoomTypeRef.current = roomType;
    }, [roomType]);

    const isScreenSharing = roomState.type === "stream" && roomState.source === "stream" && screenStream !== null;
    const isFileStreaming = roomState.type === "stream" && roomState.source === "file";

    // Get stream from player
    const getStream = useCallback((): MediaStream | null => {
        if (isScreenSharing && screenStream) return screenStream;
        if (!playerRef.current) return null;

        const video = playerRef.current.getInternalPlayer() as HTMLVideoElement & {
            captureStream?: () => MediaStream;
            mozCaptureStream?: () => MediaStream;
        };

        return video ? helper.captureStreamFromVideo(video) : null;
    }, [isScreenSharing, screenStream]);

    // Capture frame for pause overlay
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
        setIsPaused(false);
        setPauseFrameUrl(null);
        setHasVideoTrack(stream.getVideoTracks().length > 0);
    }, []);

    const handleStreamPaused = useCallback(() => {
        setPauseFrameUrl(captureFrame());
        setIsPaused(true);
    }, [captureFrame]);

    const handleStreamResumed = useCallback(() => {
        setIsPaused(false);
        setTimeout(() => setPauseFrameUrl(null), 500);
    }, []);
    const handleStreamStopped = useCallback(() => {
        console.log("[StreamPlayer] Stream stopped", remoteStream);
        setRemoteStream(null);
    }, [captureFrame]);
    const { isInitialized, initializeFromJoinResponse, replaceProducerTracks, onSeekStart, onSeekEnd, onPlay: streamOnPlay, onPause } = useStream({
        roomId: roomState.roomId,
        getStream,
        onStreamReceived: handleStreamReceived,
        onStreamPaused: handleStreamPaused,
        onStreamResumed: handleStreamResumed,
        onStreamStopped: handleStreamStopped,
        isHost,
        enabled: isJoined && roomType === "stream",
        username: authState.user?.username || authState.user?.name || "User",
        email: authState.user?.email,
        profile: authState.user?.profile,
    });

    // useEffect(() => {
    //     if (!roomType) return;
    //     const playerMessage = getPlayerMessage(isHost, roomType, hostLeft, remoteStream);
    //     console.log("playerMessage", playerMessage);    
    // }, [isHost, roomType, hostLeft, remoteStream]);
    
    // Initialize when joined
    useEffect(() => {
        if (!joinResponse || roomType !== "stream" || !isJoined || hasInitializedRef.current) return;
        hasInitializedRef.current = true;
        initializeFromJoinResponse(joinResponse);
    }, [joinResponse, roomType, isJoined, initializeFromJoinResponse]);

    // Create file URL for host
    useEffect(() => {
        if (!isHost || !isFileStreaming) return;

        const file = files[roomState.selectedFileIndex];
        if (!file) return;

        const url = URL.createObjectURL(file);
        setCurrentFileUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [files, roomState.selectedFileIndex, isHost, isFileStreaming]);

    // Handle screen stream changes (when user shares a different screen)
    useEffect(() => {
        if (!isHost || !isScreenSharing || !screenStream || !isInitialized) return;

        // Small delay to ensure the stream is ready
        const timeoutId = setTimeout(async () => {
            const stream = getStream();
            if (stream) {
                console.log("[StreamPlayer] Screen stream changed, updating producer tracks");
                try {
                    await replaceProducerTracks(stream);
                    console.log("[StreamPlayer] Producer tracks updated successfully");
                } catch (error) {
                    console.error("[StreamPlayer] Error updating producer tracks:", error);
                }
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [screenStream, isHost, isScreenSharing, isInitialized, getStream, replaceProducerTracks]);

    // Handle video ready
    const handleVideoReady = useCallback(() => {
        const currentIndex = roomState.selectedFileIndex;

        if (isHost && playerRef.current) {
            const video = playerRef.current.getInternalPlayer() as HTMLVideoElement | null;
            setHasVideoTrack(video ? video.videoWidth > 0 && video.videoHeight > 0 : true);
        }

        if (isHost && isInitialized) {
            if (lastVideoIndexRef.current === -1) {
                lastVideoIndexRef.current = currentIndex;
            } else if (lastVideoIndexRef.current !== currentIndex) {
                lastVideoIndexRef.current = currentIndex;
                setTimeout(async () => {
                    const stream = getStream();
                    if (stream) await replaceProducerTracks(stream);
                }, 500);
            }
        }
    }, [isHost, isInitialized, roomState.selectedFileIndex, getStream, replaceProducerTracks]);

    const handleVideoEnded = useCallback(() => {
        if (!roomState.host) return;
        console.log("Video ended - marking for track refresh on next play");
        videoEndedRef.current = true;
    }, [roomState.host]);

    const onPlay = useCallback((event: string) => {
        streamOnPlay(event);

        if (isHost && isInitialized && videoEndedRef.current) {
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
                        showError("Stream update failed", "Unable to update video stream. The video may continue playing.");
                    }
                }
            }, 500);
        }
    }, [streamOnPlay, isInitialized, isHost, getStream, replaceProducerTracks]);

    const source = isHost ? (isScreenSharing ? screenStream : currentFileUrl) : remoteStream;
    console.log("source", source, remoteStream);
    
    // Show empty state when: no source available OR host has left
    if (!source || hostLeft) {
        return (
            <StreamPlayerEmptyState
                isHost={isHost}
                roomType={roomType}
                hostLeft={hostLeft}
                remoteStream={remoteStream}
                isInitialized={isInitialized}
            />
        );
    }

    return (
        <div className="relative w-full h-full">
            <Player
                key={isHost ? `host-${roomState.selectedFileIndex}` : `consumer-${remoteStream?.id}`}
                playerRef={playerRef}
                playing={helper.getInitialPlayerState({ url: source, roomType: roomType || "stream", host: isHost, focused: roomState.focused, screenSharing: isScreenSharing, hostLeft: hostLeft, paused: isPaused }).playing }
                onReady={handleVideoReady}
                onEnded={handleVideoEnded}
                onSeekStart={onSeekStart}
                onSeekEnd={onSeekEnd}
                fullscreenTargetRef={fullscreenTargetRef}
                url={source}
                muted={helper.getInitialPlayerState({ url: source, roomType: roomType || "stream", host: isHost, focused: roomState.focused, screenSharing: isScreenSharing, hostLeft: hostLeft, paused: isPaused }).muted }
                onPlay={onPlay}
                onPause={onPause}
                hasVideoTrack={hasVideoTrack}
                disableControls={helper.getPlayerControlsConfig(source, isHost).disableControls}
                hideControls={helper.getPlayerControlsConfig(source, isHost).hideControls}
            >
                <PlayerOverlay />
            </Player>

            {!isHost && pauseFrameUrl && (
                <div className="absolute inset-0 z-0 pointer-events-none">
                    <img src={pauseFrameUrl} alt="Paused" className="w-full h-full object-contain bg-black" />
                </div>
            )}
        </div>
    );
};

export default StreamPlayer;