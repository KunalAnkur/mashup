import { useEffect, useState, useCallback } from "react";
import type ReactPlayer from "react-player";
import { useSocket } from "@/context/SocketContext";

interface UseVideoSyncParams {
    playerRef: React.RefObject<ReactPlayer | null>;
    isHost: boolean;
}

type VideoState = {
    playing: boolean;
    currentTime: number;
};

export const useVideoSync = ({ playerRef, isHost }: UseVideoSyncParams) => {
    const { socket, isConnected } = useSocket();
    const [isPlaying, setIsPlaying] = useState(false);
    const [roomId, setRoomId] = useState<string>();
    const [isJoined, setIsJoined] = useState(false);
    const [videoState, setVideoState] = useState<VideoState>({
        playing: false,
        currentTime: 0,
    });

    const updateState = useCallback(() => {
        if (playerRef.current) {
            const currentTime = playerRef.current.getCurrentTime?.() || 0;
            const state = { playing: isPlaying, currentTime };
            setVideoState(state);
            return state;
        }
        return videoState;
    }, [isPlaying, playerRef]);

    const syncVideoTo = useCallback((srcState: VideoState) => {
        if (!playerRef.current) return;
        console.log('sync to', srcState, videoState);
        const currentTime = playerRef.current.getCurrentTime();
        if (videoState.playing === srcState.playing && currentTime === srcState.currentTime) return;
        const drift = Math.abs(currentTime - srcState.currentTime);

        drift > 1 && playerRef.current.seekTo(srcState.currentTime, "seconds");
        if (!srcState.playing) setIsPlaying(false);
        else setIsPlaying(true);
        const state = updateState();
        console.log('after sync', srcState, state, srcState.currentTime, drift);
    }, [playerRef, updateState]);

    const syncVideoWithHost = useCallback(() => {
        if (!isJoined) return;
        if (!isHost) {
            console.log("Syncing with host started");
            socket?.emit("syncwithhost", { roomId });
        }
    }, [isHost, socket, roomId, isJoined]);

    const onPlay = useCallback((event: string) => {
        if (event === 'seekend') return;
        setIsPlaying(true);
        if (!isJoined) return;
        if (!isHost) {
            console.log("initiated sync video with host");
            syncVideoWithHost();
            return;
        }
        console.log("Host event: ", isHost)
        updateState();
        socket?.emit("onplay", {
            roomId, videoState: {
                playing: true,
                currentTime: playerRef.current?.getCurrentTime()
            }
        });
    }, [isHost, isJoined, roomId, socket, syncVideoWithHost, updateState]);

    const onPause = useCallback((event: string) => {
        if (event === "seekend") return;
        setIsPlaying(false);
        if (!isJoined) return;
        if (!isHost) {
            console.log("initiated sync video with host on pause");
            syncVideoWithHost();
            return;
        }
        updateState();
        socket?.emit("onpause", {
            roomId, videoState: {
                playing: false,
                currentTime: playerRef.current?.getCurrentTime()
            }
        });
    }, [isHost, isJoined, roomId, socket, syncVideoWithHost, updateState]);

    const onSeeked = useCallback(() => {
        if (!isJoined) return
        if (!isHost) {
            console.log("initiated sync video with host on seeked");
            syncVideoWithHost();
            return;
        }
        const state = updateState();
        socket?.emit("onseeked", {
            roomId, videoState: state
        });
    }, [isHost, roomId, socket, syncVideoWithHost, updateState]);

    const joinRoom = (room: string, isHostFlag: boolean) => {
        setRoomId(room);
        setIsJoined(true);
        socket?.emit("joinroom", { roomId: room, host: isHostFlag, name: "random" });
    };

    useEffect(() => {
        if (!socket) return;

        const handleVideoEvent = ({ host, videoState }: { host: boolean, videoState: VideoState }) => {
            if (!isHost) syncVideoTo(videoState);
        };

        const handleSyncWithHost = () => {
            if (!isHost) return;
            const state = updateState();
            console.log('host video state request', {
                roomId: roomId ?? "room",
                videoState: state,
            });
            socket.emit("hostvideostate", {
                roomId: roomId ?? "room",
                videoState: state,
            });
        };

        const handleHostVideoState = ({ hostVideoState }: { hostVideoState: VideoState }) => {
            if (!isHost) syncVideoTo(hostVideoState);
        };

        socket.on("onpause", handleVideoEvent);
        socket.on("onplay", handleVideoEvent);
        socket.on("onseeked", handleVideoEvent);
        socket.on("syncwithhost", handleSyncWithHost);
        socket.on("hostvideostate", handleHostVideoState);

        // if (!isHost){ 
        //     console.log("initiated sync video with host")
        //     syncVideoWithHost()
        // };

        return () => {
            socket.off("onpause", handleVideoEvent);
            socket.off("onplay", handleVideoEvent);
            socket.off("onseeked", handleVideoEvent);
            socket.off("syncwithhost", handleSyncWithHost);
            socket.off("hostvideostate", handleHostVideoState);
        };
    }, [socket, isHost, playerRef, roomId, updateState]);

    return { onPlay, onPause, onSeeked, isPlaying, joinRoom, isConnected };
};
