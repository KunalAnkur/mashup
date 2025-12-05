"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from "react";
import { useSocket } from "@/context/SocketContext";
import { SocketEvent } from "@/types/socketEvents";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/lib/store";
import { exitRoom } from "@/lib/store/slices/roomSlice";

export type RoomType = "stream" | "sync";
export interface UserInfo {
    socketId: string;
    roomId: string;
    username: string;
    email?: string;
    profile?: string;
    name?: string;
    host: boolean;
    roomType: RoomType;
    joinedAt: number;
}
interface JoinResponse {
    success: boolean;
    roomId: string;
    roomType: RoomType;
    chatHistory?: any[];
    rtpCapabilities?: any;
    sendTransportOptions?: any;
    recvTransportOptions?: any;
    users?: UserInfo[];
    existingProducers?: Record<string, any[]>;
    error?: string;
}

interface RoomContextType {
    isJoined: boolean;
    isLoading: boolean;
    roomType: RoomType | null;
    hostLeft: boolean;
    roomClosed: boolean;
    joinResponse: JoinResponse | null;
    roomId: string | null;
    isHost: boolean;
    username: string;
    leaveRoom: () => void;
}

const RoomContext = createContext<RoomContextType | null>(null);

export const RoomProvider = ({ children }: { children: ReactNode }) => {
    const { socket, isConnected } = useSocket();
    const dispatch = useDispatch();

    const roomState = useSelector((state: RootState) => state.room);
    const authState = useSelector((state: RootState) => state.auth);

    const roomId = roomState.roomId;
    const isHost = roomState.host;
    const roomTypeFromRedux = roomState.type as RoomType;
    const username = authState.user?.username || authState.user?.name || "User";
    const email = authState.user?.email;
    const profile = authState.user?.profile;

    const [isJoined, setIsJoined] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [roomType, setRoomType] = useState<RoomType | null>(null);
    const [hostLeft, setHostLeft] = useState(false);
    const [roomClosed, setRoomClosed] = useState(false);
    const [joinResponse, setJoinResponse] = useState<JoinResponse | null>(null);

    const joinAttemptedRef = useRef(false);
    const currentRoomRef = useRef<string | null>(null);

    const joinRoom = useCallback(async () => {
        if (!socket || !roomId || !username) return;
        if (joinAttemptedRef.current && currentRoomRef.current === roomId) return;
        if (isJoined && currentRoomRef.current === roomId) return;

        setIsLoading(true);
        joinAttemptedRef.current = true;

        try {
            const response = await socket.emitWithAck(SocketEvent.JOIN_ROOM, {
                roomId,
                host: isHost,
                username,
                email,
                profile,
                roomType: roomTypeFromRedux,
            }) as JoinResponse;

            if (response?.success) {
                setIsJoined(true);
                currentRoomRef.current = roomId;
                setRoomType(response.roomType || roomTypeFromRedux);
                setJoinResponse(response);
                setHostLeft(false);
                setRoomClosed(false);
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
    }, [socket, roomId, isHost, username, email, profile, roomTypeFromRedux, isJoined]);

    const leaveRoom = useCallback(() => {
        if (!socket || !roomId) return;

        socket.emit(SocketEvent.LEAVE_ROOM, { roomId });
        setIsJoined(false);
        setRoomType(null);
        setHostLeft(false);
        setRoomClosed(false);
        setJoinResponse(null);
        joinAttemptedRef.current = false;
        currentRoomRef.current = null;
        dispatch(exitRoom());
    }, [socket, roomId, dispatch]);

    // Auto-join
    useEffect(() => {
        if (roomId && socket && username && isConnected && !isJoined && !joinAttemptedRef.current) {
            joinRoom();
        }
    }, [roomId, socket, username, isConnected, isJoined, joinRoom]);

    // Reset on room change
    useEffect(() => {
        if (roomId !== currentRoomRef.current) {
            joinAttemptedRef.current = false;
            currentRoomRef.current = null;
        }
    }, [roomId]);

    // Socket events
    useEffect(() => {
        if (!socket) return;

        const handleHostLeft = (data: { roomId?: string }) => {
            if (!data.roomId || data.roomId === roomId) {
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

        const handleHostJoined = (data: { roomId: string }) => {
            if (!data.roomId || data.roomId === roomId) {
                setHostLeft(false);
                setRoomClosed(true);
            }
        };

        socket.on(SocketEvent.HOST_LEFT, handleHostLeft);
        socket.on(SocketEvent.LEAVE_ROOM, handleRoomClosed);
        socket.on(SocketEvent.HOST_JOINED, handleHostJoined);
        return () => {
            socket.off(SocketEvent.HOST_LEFT, handleHostLeft);
            socket.off(SocketEvent.LEAVE_ROOM, handleRoomClosed);
            socket.off(SocketEvent.HOST_JOINED, handleHostJoined);
        };
    }, [socket, roomId]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (isJoined && socket && roomId) {
                socket.emit(SocketEvent.LEAVE_ROOM, { roomId });
            }
        };
    }, []);

    return (
        <RoomContext.Provider value={{
            isJoined,
            isLoading,
            roomType,
            hostLeft,
            roomClosed,
            joinResponse,
            roomId,
            isHost,
            username,
            leaveRoom,
        }}>
            {children}
        </RoomContext.Provider>
    );
};

export const useRoomContext = () => {
    const context = useContext(RoomContext);
    if (!context) {
        throw new Error("useRoomContext must be used within a RoomProvider");
    }
    return context;
};
