"use client"
import { Player } from "../VideoPlayer"
import { useRef, useState } from "react";
import type ReactPlayer from "react-player";
import { useVideoSync } from "@/hooks-old/useVideoSync"; // adjust path if needed


const PlayerContainer = () => {
    const [videoUrl, setVideoUrl] = useState<string | string[]>('https://www.youtube.com/watch?v=sElE_BfQ67s');
    const [isHost, setIsHost] = useState(false);
    const playerRef = useRef<ReactPlayer>(null);

    // ⬇️ use the custom hook
    const {
        onPlay,
        onPause,
        onSeeked,
        isPlaying,
        joinRoom,
    } = useVideoSync({ playerRef, isHost });

    const handleHost = (e: React.ChangeEvent<HTMLInputElement>) => {
        setIsHost(e.target.checked);
    };

    const handleJoinRoom = () => {
        // joinRoom("my-room", isHost); // Room ID can be dynamic
    };
    return (
        <Player
            playerRef={playerRef}
            url={videoUrl}
            playing={isPlaying}
            onPlay={onPlay}
            onPause={onPause}
            onSeekEnd={onSeeked}
        // loop={true}
        />
    );
};

export default PlayerContainer;
