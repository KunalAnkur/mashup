import { useEffect, useState, useCallback } from "react";
import type ReactPlayer from "react-player";
import { useSocket } from "@/context/SocketContext";
import { SocketEvent } from "@/types/socketEvents";

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
            socket?.emit(SocketEvent.SYNCWITHHOST, { roomId });
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
        socket?.emit(SocketEvent.ONPLAY, {
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
        socket?.emit(SocketEvent.ONPAUSE, {
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
        socket?.emit(SocketEvent.ONSEEKED, {
            roomId, videoState: state
        });
    }, [isHost, roomId, socket, syncVideoWithHost, updateState]);

    const joinRoom = (room: string, isHostFlag: boolean, username: string) => {
        setRoomId(room);
        setIsJoined(true);
        console.log({ roomId: room, host: isHostFlag, name: username }, socket);
        socket?.emit(SocketEvent.JOIN_ROOM, { roomId: room, host: isHostFlag, name: username });
    };

    useEffect(() => {
        if (!socket) return;

        const handleVideoEvent = ({ host, videoState }: { host: boolean, videoState: VideoState }) => {
            if (!isHost) syncVideoTo(videoState);
        };

        const handleSyncWithHost = () => {
            console.log("sync with host requested", isHost);
            if (!isHost) return;
            const state = updateState();
            console.log('host video state request', {
                roomId: roomId ?? "room",
                videoState: state,
            });
            socket.emit(SocketEvent.HOSTVIDEOSTATE, {
                roomId: roomId ?? "room",
                videoState: state,
            });
        };

        const handleHostVideoState = ({ hostVideoState }: { hostVideoState: VideoState }) => {
            if (!isHost) syncVideoTo(hostVideoState);
        };

        socket.on(SocketEvent.ONPAUSE, handleVideoEvent);
        socket.on(SocketEvent.ONPLAY, handleVideoEvent);
        socket.on(SocketEvent.ONSEEKED, handleVideoEvent);
        socket.on(SocketEvent.SYNCWITHHOST, handleSyncWithHost);
        socket.on(SocketEvent.HOSTVIDEOSTATE, handleHostVideoState);

        // if (!isHost){ 
        //     console.log("initiated sync video with host")
        //     syncVideoWithHost()
        // };

        return () => {
            socket.off(SocketEvent.ONPAUSE, handleVideoEvent);
            socket.off(SocketEvent.ONPLAY, handleVideoEvent);
            socket.off(SocketEvent.ONSEEKED, handleVideoEvent);
            socket.off(SocketEvent.SYNCWITHHOST, handleSyncWithHost);
            socket.off(SocketEvent.HOSTVIDEOSTATE, handleHostVideoState);
        };
    }, [socket, isHost, playerRef, roomId, updateState]);

    return { socket, onPlay, onPause, onSeeked, isPlaying, joinRoom, isConnected };
};
