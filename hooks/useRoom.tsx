import { useEffect, useState, useCallback, useRef } from "react";
import { useSocket } from "@/context/SocketContext";
import { SocketEvent } from "@/types/socketEvents";

export type RoomType = "stream" | "sync";

interface UseRoomParams {
    roomId: string | null;
    host: boolean;
    username: string;
    name?: string;
    email?: string;
    profile?: string;
    roomType?: RoomType;
    autoJoin?: boolean;
}

interface UseRoomReturn {
    isJoined: boolean;
    isLoading: boolean;
    roomType: RoomType | null;
    hostLeft: boolean;
    roomClosed: boolean;
    joinResponse: any | null;
    joinRoom: () => Promise<void>;
    leaveRoom: () => void;
}

/**
 * Standalone room hook - use RoomContext/useRoomContext instead for most cases
 */
export const useRoom = ({
    roomId,
    host,
    username,
    name,
    email,
    profile,
    roomType = "sync",
    autoJoin = true,
}: UseRoomParams): UseRoomReturn => {
    const { socket, isConnected } = useSocket();

    const [isJoined, setIsJoined] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [currentRoomType, setCurrentRoomType] = useState<RoomType | null>(null);
    const [hostLeft, setHostLeft] = useState(false);
    const [roomClosed, setRoomClosed] = useState(false);
    const [joinResponse, setJoinResponse] = useState<any | null>(null);

    const joinAttemptedRef = useRef(false);
    const currentRoomRef = useRef<string | null>(null);

    const joinRoom = useCallback(async () => {
        if (!socket || !roomId || !username) return;
        if (currentRoomRef.current === roomId && isJoined) return;
        if (joinAttemptedRef.current && currentRoomRef.current === roomId) return;

        setIsLoading(true);
        joinAttemptedRef.current = true;

        try {
            const response = await socket.emitWithAck(SocketEvent.JOIN_ROOM, {
                roomId,
                host,
                username,
                name,
                email,
                profile,
                roomType,
            });

            if (response?.success) {
                setIsJoined(true);
                currentRoomRef.current = roomId;
                setCurrentRoomType(response.roomType || roomType);
                setJoinResponse(response);
            } else {
                setIsJoined(false);
                setJoinResponse(null);
                joinAttemptedRef.current = false;
            }
        } catch {
            setIsJoined(false);
            joinAttemptedRef.current = false;
        } finally {
            setIsLoading(false);
        }
    }, [socket, roomId, host, username, name, email, profile, roomType, isJoined]);

    const leaveRoom = useCallback(() => {
        if (!socket || !roomId) return;

        socket.emit(SocketEvent.LEAVE_ROOM, { roomId });
        setIsJoined(false);
        setCurrentRoomType(null);
        setHostLeft(false);
        setRoomClosed(false);
        setJoinResponse(null);
        joinAttemptedRef.current = false;
        currentRoomRef.current = null;
    }, [socket, roomId]);

    // Auto-join
    useEffect(() => {
        if (autoJoin && roomId && socket && username && isConnected && !isJoined && !joinAttemptedRef.current) {
            joinRoom();
        }
    }, [autoJoin, roomId, socket, username, isConnected, isJoined, joinRoom]);

    // Reset on room change
    useEffect(() => {
        if (roomId !== currentRoomRef.current) {
            joinAttemptedRef.current = false;
        }
    }, [roomId]);

    useEffect(() => {
        if (isConnected && roomId && !isJoined) {
            joinAttemptedRef.current = false;
        }
    }, [isConnected, roomId, isJoined]);

    // Socket events
    useEffect(() => {
        if (!socket) return;

        const handleHostLeft = (data: { roomId: string }) => {
            if (data.roomId === roomId) {
                setHostLeft(true);
                setRoomClosed(true);
            }
        };

        const handleRoomClosed = (data: { roomId: string }) => {
            if (data.roomId === roomId) {
                setRoomClosed(true);
                setIsJoined(false);
            }
        };

        socket.on(SocketEvent.HOST_LEFT, handleHostLeft);
        socket.on(SocketEvent.LEAVE_ROOM, handleRoomClosed);

        return () => {
            socket.off(SocketEvent.HOST_LEFT, handleHostLeft);
            socket.off(SocketEvent.LEAVE_ROOM, handleRoomClosed);
        };
    }, [socket, roomId]);

    // Cleanup
    useEffect(() => {
        return () => {
            if (autoJoin && isJoined && socket && roomId) {
                socket.emit(SocketEvent.LEAVE_ROOM, { roomId });
            }
        };
    }, []);

    return {
        isJoined,
        isLoading,
        roomType: currentRoomType,
        hostLeft,
        roomClosed,
        joinResponse,
        joinRoom,
        leaveRoom,
    };
};
