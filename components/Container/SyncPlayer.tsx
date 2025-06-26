"use client";
import { useEffect, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/lib/store";
import type ReactPlayer from "react-player";
import { Player } from "@/components/VideoPlayer";
import PlayerOverlay from "@/components/Container/PlayerOverlay";
import { useVideoSync } from "@/hooks/useVideoSync";
import { helper } from "@/utils";

type Props = {
    fullscreenTargetRef?: React.RefObject<HTMLDivElement>;
};

const SyncPlayer = ({ fullscreenTargetRef }: Props) => {
    const roomState = useSelector((state: RootState) => state.room);
    const authState = useSelector((state: RootState) => state.auth);
    const playerRef = useRef<ReactPlayer>(null);

    const [videoUrl, setVideoUrl] = useState("");

    const {
        socket,
        onPlay,
        onPause,
        onSeeked,
        isPlaying,
        joinRoom,
    } = useVideoSync({ playerRef, isHost: roomState.host });

    useEffect(() => {
        const url = roomState.urls[roomState.selectedFileIndex];
        if (url) setVideoUrl(url);
    }, [roomState.urls, roomState.selectedFileIndex]);

    useEffect(() => {
        if (socket && authState.isAuthenticated && roomState.roomId) {
            joinRoom(roomState.roomId, roomState.host, authState.user?.username!);
        }
    }, [socket, authState.isAuthenticated, roomState.roomId, roomState.host]);

    return (
        <Player
            playerRef={playerRef}
            playing={isPlaying}
            onPlay={onPlay}
            onPause={onPause}
            onSeekEnd={onSeeked}
            fullscreenTargetRef={fullscreenTargetRef}
            url={videoUrl}
            muted={false}
            disableControls={helper.getPlayerControlsConfig(videoUrl, roomState.host).disableControls}
            hideControls={helper.getPlayerControlsConfig(videoUrl, roomState.host).hideControls}
        >
            <PlayerOverlay />
        </Player>
    );
};

export default SyncPlayer;