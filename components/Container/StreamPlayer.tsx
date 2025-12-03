"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import { useFileContext } from "@/context/FileContext";
import { useMediaStreamContext } from "@/context/MediaStreamContext";
import { Player } from "@/components/VideoPlayer";
import PlayerOverlay from "@/components/Container/PlayerOverlay";
import type ReactPlayer from "react-player";
import { useStream } from "@/hooks";
import { useRoomContext } from "@/context/RoomContext";
import { helper } from "@/utils";

type Props = {
    fullscreenTargetRef?: React.RefObject<HTMLDivElement>;
};

const StreamPlayer = ({ fullscreenTargetRef }: Props) => {
    const roomState = useSelector((state: RootState) => state.room);
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

    const { isJoined, roomType, joinResponse, isHost } = useRoomContext();

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

    const {
        isInitialized,
        initializeFromJoinResponse,
        pauseProducers,
        resumeProducers,
        replaceProducerTracks,
        onSeekStart,
        onSeekEnd,
    } = useStream({
        roomId: roomState.roomId,
        getStream,
        onStreamReceived: handleStreamReceived,
        onStreamPaused: handleStreamPaused,
        onStreamResumed: handleStreamResumed,
        isHost,
        enabled: isJoined && roomType === "stream",
    });

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

    const onPlay = useCallback(() => {
        if (isHost && isInitialized) resumeProducers();
    }, [isHost, isInitialized, resumeProducers]);

    const onPause = useCallback(() => {
        if (isHost && isInitialized) pauseProducers();
    }, [isHost, isInitialized, pauseProducers]);

    const source = isHost ? (isScreenSharing ? screenStream : currentFileUrl) : remoteStream;

    if (!source) {
        return (
            <div className="flex items-center justify-center h-full bg-black">
                <div className="text-white/60 text-center">
                    <div className="animate-pulse mb-2">
                        {isHost ? "🎬 Loading video..." : "📡 Waiting for stream..."}
                    </div>
                    <div className="text-sm text-white/40">
                        {isHost ? "Preparing to stream" : `Connecting... ${isInitialized ? '(Ready)' : ''}`}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="relative w-full h-full">
            <Player
                key={isHost ? `host-${roomState.selectedFileIndex}` : `consumer-${remoteStream?.id}`}
                playerRef={playerRef}
                playing={isHost ? isScreenSharing : !isPaused}
                onReady={handleVideoReady}
                onSeekStart={onSeekStart}
                onSeekEnd={onSeekEnd}
                fullscreenTargetRef={fullscreenTargetRef}
                url={source}
                muted={false}
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
