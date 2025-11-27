"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/lib/store";
import { useFileContext } from "@/context/FileContext";
import { Player } from "@/components/VideoPlayer";
import PlayerOverlay from "@/components/Container/PlayerOverlay";
import type ReactPlayer from "react-player";
import { useMediaSoup } from "@/hooks/useMediaSoup";
import { setUrls } from "@/lib/store/slices/roomSlice";
import { helper } from "@/utils";

type Props = {
    fullscreenTargetRef?: React.RefObject<HTMLDivElement>;
};

const FileStreamPlayer = ({ fullscreenTargetRef }: Props) => {
    const roomState = useSelector((state: RootState) => state.room);
    const authState = useSelector((state: RootState) => state.auth);
    const dispatch = useDispatch();
    const { files } = useFileContext();
    const playerRef = useRef<ReactPlayer>(null);
    const [videoReady, setVideoReady] = useState(false);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

    // Get stream from player (for host to produce)
    const getStream = useCallback((): MediaStream | null => {
        if (!playerRef.current) return null;
        const videoElement = playerRef.current.getInternalPlayer() as (HTMLVideoElement & { captureStream?: () => MediaStream });
        if (!videoElement?.captureStream) return null;
        return videoElement.captureStream();
    }, []);

    // Handle received stream (for consumers)
    const handleStreamReceived = useCallback((stream: MediaStream) => {
        setRemoteStream(stream);
    }, []);

    const { joinRoom, isConnected, onPause, onPlay } = useMediaSoup({ 
        getStream,
        onStreamReceived: handleStreamReceived,
        isHost: roomState.host 
    });

    // Create object URL for file
    useEffect(() => {
        const file = files[roomState.selectedFileIndex];
        if (file) {
            const url = URL.createObjectURL(file);
            dispatch(setUrls([url]));
            return () => URL.revokeObjectURL(url);
        }
    }, [files, roomState.selectedFileIndex, dispatch]);

    // Join room when ready
    useEffect(() => {
        if (authState.isAuthenticated && roomState.roomId && isConnected) {
            console.log('Join room emitting', { videoReady, host: roomState.host });
            if ((videoReady && roomState.host) || (!videoReady && !roomState.host)) {
                joinRoom(roomState.roomId, roomState.host, authState.user?.username!);
            }
        }
    }, [authState.isAuthenticated, roomState.roomId, roomState.host, videoReady, isConnected, joinRoom, authState.user?.username]);
    
    // Determine video source
    const [source, setSource] = useState<string | MediaStream>(roomState.urls[roomState.selectedFileIndex]);
    
    useEffect(() => {
        if (remoteStream && !roomState.host) {
            // Consumer: use received stream
            setSource(remoteStream);
        } else if (roomState.host && roomState.urls[roomState.selectedFileIndex]) {
            // Host: use local file URL
            setSource(roomState.urls[roomState.selectedFileIndex]);
        }
    }, [remoteStream, roomState.host, roomState.urls, roomState.selectedFileIndex]);
    
    return (
        <>
            <Player
                playerRef={playerRef}
                playing={!roomState.host}
                onReady={() => setVideoReady(true)}
                fullscreenTargetRef={fullscreenTargetRef}
                url={source}
                muted={false}
                onPlay={onPlay}
                onPause={onPause}
                disableControls={helper.getPlayerControlsConfig(source, roomState.host).disableControls}
                hideControls={helper.getPlayerControlsConfig(source, roomState.host).hideControls}
            >
                <PlayerOverlay />
            </Player>
        </>
    );
};

export default FileStreamPlayer;