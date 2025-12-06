"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from "react";
import { useSocket } from "@/context/SocketContext";
import { SocketEvent } from "@/types/socketEvents";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/lib/store";
import { exitRoom, updateRoomInfo } from "@/lib/store/slices/roomSlice";
import { showError } from "@/utils/toast";

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
export interface RoomInformation {
    type: "stream" | "sync";
    source: "file" | "url" | "stream";
    urls: string[];
    files: string[];
    selectedFileIndex: number;
}
interface JoinResponse {
    success: boolean;
    roomId: string;
    roomType: RoomType;
    chatHistory?: any[];
    rtpCapabilities?: any;
    sendTransportOptions?: any;
    recvTransportOptions?: any;
    room: RoomInformation;
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
    
    // Sync roomType from Redux when it changes (e.g., from room info update)
    useEffect(() => {
        if (roomTypeFromRedux && roomTypeFromRedux !== roomType) {
            console.log(`[RoomContext] Room type synced from Redux: ${roomType} -> ${roomTypeFromRedux}`);
            setRoomType(roomTypeFromRedux);
        }
    }, [roomTypeFromRedux, roomType]);

    const joinAttemptedRef = useRef(false);
    const currentRoomRef = useRef<string | null>(null);

    const joinRoom = useCallback(async () => {
        if (!socket || !roomId || !username) return;
        if (joinAttemptedRef.current && currentRoomRef.current === roomId) return;
        if (isJoined && currentRoomRef.current === roomId) return;

        setIsLoading(true);
        joinAttemptedRef.current = true;

        try {
            console.log("room state while joining", roomState);
            const response = await socket.emitWithAck(SocketEvent.JOIN_ROOM, {
                roomId,
                host: isHost,
                username,
                email,
                profile,
                room: {
                    type: roomTypeFromRedux,
                    source: roomState.source,
                    urls: roomState.urls,
                    files: roomState.files,
                    selectedFileIndex: roomState.selectedFileIndex,
                } as RoomInformation,
                // roomType: roomTypeFromRedux,
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
                const errorMessage = response?.error || "Failed to join room";
                showError("Failed to join room", errorMessage);
            }
        } catch (error: any) {
            console.error("Error joining room:", error);
            setIsJoined(false);
            joinAttemptedRef.current = false;
            const errorMessage = error?.message || "Unable to connect to room. Please check your connection and try again.";
            showError("Failed to join room", errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, [socket, roomId, isHost, username, email, profile, roomState, roomTypeFromRedux, isJoined]);

    const leaveRoom = useCallback(() => {
        if (!socket || !roomId) return;

        socket.emit(SocketEvent.LEAVE_ROOM, { roomId, room: roomState });
        // dispatch(exitRoom());
        setIsJoined(false);
        setRoomType(null);
        setHostLeft(false);
        setRoomClosed(false);
        setJoinResponse(null);
        joinAttemptedRef.current = false;
        currentRoomRef.current = null;
        dispatch(exitRoom());
    }, [socket, roomId, roomState, dispatch]);

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

        // Handle room info update when host joins with new videos or different room type
        const handleRoomInfoUpdated = (data: { 
            roomId: string; 
            room: {
                urls?: string[];
                files?: string[];
                selectedFileIndex?: number;
                source?: "file" | "url" | "stream";
                type?: "stream" | "sync";
            };
        }) => {
            if (data.roomId === roomId && !isHost) {
                // Validate selectedFileIndex is within bounds
                const urls = data.room.urls || [];
                const files = data.room.files || [];
                const maxIndex = Math.max(urls.length, files.length) - 1;
                const selectedIndex = data.room.selectedFileIndex !== undefined 
                    ? Math.min(Math.max(0, data.room.selectedFileIndex), maxIndex)
                    : 0;
                
                const newRoomType = data.room.type;
                const currentRoomType = roomType;
                
                console.log("[RoomContext] Room info updated from host:", {
                    ...data.room,
                    selectedFileIndex: selectedIndex,
                    newRoomType,
                    currentRoomType,
                });
                
                // Check if room type is changing
                if (newRoomType && newRoomType !== currentRoomType) {
                    console.log(`[RoomContext] Room type changed from ${currentRoomType} to ${newRoomType}`);
                    
                    // If switching room types, we need to rejoin to get proper setup
                    // Stream rooms need MediaSoup setup, sync rooms need different initialization
                    if (newRoomType === "stream" && currentRoomType === "sync") {
                        console.log("[RoomContext] Room type changed to stream - triggering rejoin for MediaSoup setup");
                        // Reset join state to allow rejoin
                        setIsJoined(false);
                        joinAttemptedRef.current = false;
                        // Clear join response to force fresh initialization
                        setJoinResponse(null);
                        // Update room type first
                        setRoomType(newRoomType);
                        // Rejoin will happen automatically via the auto-join effect
                    } else if (newRoomType === "sync" && currentRoomType === "stream") {
                        console.log("[RoomContext] Room type changed to sync - triggering rejoin");
                        // Reset join state to allow rejoin
                        setIsJoined(false);
                        joinAttemptedRef.current = false;
                        // Clear join response
                        setJoinResponse(null);
                        // Update room type
                        setRoomType(newRoomType);
                        // Rejoin will happen automatically via the auto-join effect
                    } else {
                        // For other cases, just update the type
                        setRoomType(newRoomType);
                    }
                }
                
                // Update Redux state with new room information (including type)
                dispatch(updateRoomInfo({
                    urls,
                    files,
                    selectedFileIndex: selectedIndex,
                    source: data.room.source,
                    type: newRoomType,
                }));
            }
        };

        socket.on(SocketEvent.HOST_LEFT, handleHostLeft);
        socket.on(SocketEvent.LEAVE_ROOM, handleRoomClosed);
        socket.on(SocketEvent.HOST_JOINED, handleHostJoined);
        socket.on(SocketEvent.ROOM_INFO_UPDATED, handleRoomInfoUpdated);
        return () => {
            socket.off(SocketEvent.HOST_LEFT, handleHostLeft);
            socket.off(SocketEvent.LEAVE_ROOM, handleRoomClosed);
            socket.off(SocketEvent.HOST_JOINED, handleHostJoined);
            socket.off(SocketEvent.ROOM_INFO_UPDATED, handleRoomInfoUpdated);
        };
    }, [socket, roomId, isHost, dispatch]);

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
