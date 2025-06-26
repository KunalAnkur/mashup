"use client";
import { useEffect, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/lib/store";
import { useFileContext } from "@/context/FileContext";
import { Player } from "@/components/VideoPlayer";
import PlayerOverlay from "@/components/Container/PlayerOverlay";
import type ReactPlayer from "react-player";
import { useMediaSoup } from "@/hooks/useMediaSoup";
import { setUrls } from "@/lib/store/slices/roomSlice";
import { helper } from "@/utils"
import { useMediaStreamContext } from "@/context/MediaStreamContext";

type Props = {
    fullscreenTargetRef?: React.RefObject<HTMLDivElement>;
};

const FileStreamPlayer = ({ fullscreenTargetRef }: Props) => {
    const roomState = useSelector((state: RootState) => state.room);
    const authState = useSelector((state: RootState) => state.auth);
    const dispatch = useDispatch();
    const { files } = useFileContext();
    const { stream } = useMediaStreamContext();
    const playerRef = useRef<ReactPlayer>(null);
    const [videoReady, setVideoReady] = useState(false);
    const { joinRoom, isConnected, onPause, onPlay } = useMediaSoup({ playerRef, isHost: roomState.host });

    useEffect(() => {
        const file = files[roomState.selectedFileIndex];
        if (file) {
            const url = URL.createObjectURL(file);
            dispatch(setUrls([url]));
            return () => URL.revokeObjectURL(url);
        }
    }, [files, roomState.selectedFileIndex, dispatch]);

    useEffect(() => {
        if (authState.isAuthenticated && roomState.roomId && isConnected) {
            console.log('Join room emiting',{ videoReady , host: roomState.host})
            if ((videoReady && roomState.host) || (!videoReady && !roomState.host))
                joinRoom(roomState.roomId, roomState.host, authState.user?.username!);
        }
    }, [authState.isAuthenticated, roomState.roomId, roomState.host, videoReady, isConnected]);
    

    const [source, setSource] = useState<string | MediaStream>(roomState.urls[roomState.selectedFileIndex]);
    useEffect(() => {
        if (stream && !roomState.host) {
            setSource(stream);
        }
    }, [stream, roomState.host]);
    
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