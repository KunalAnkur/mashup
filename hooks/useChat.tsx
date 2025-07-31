import { useEffect, useState, useCallback } from "react";
import { useSocket } from "@/context/SocketContext";
import { SocketEvent } from "@/types/socketEvents";

interface UseMediaSoupParams {
    isHost: boolean;
}

interface RoomState {
    name: string;
    isHost: boolean;
    username: string;
    joined: boolean;
}


export const useChat = ({ isHost }: UseMediaSoupParams) => {
    const { socket, isConnected } = useSocket('chat');
    const [roomState, setRoomState] = useState<RoomState>({
        name: '',
        isHost,
        username: '',
        joined: false,
    });


    const joinRoom = useCallback(async (room: string, isHostFlag: boolean, username: string) => {
        if (!socket) {
            return;
        }

        try {
            const response = await socket.emitWithAck(SocketEvent.JOIN_ROOM, {
                roomId: room,
                host: isHostFlag
            });
            if (isHostFlag) {
                    

            } else {
                
            }

            setRoomState(prev => ({
                ...prev,
                name: room,
                isHost: isHostFlag,
                username,
                joined: true,
            }));
        } catch (error) {
            console.error('Failed to join room:', error);
        }
    }, [socket]);

    useEffect(() => {
        if (!socket) return;
        const handleChatMessage = async (data: any) => {
            
        }
        
        socket.on(SocketEvent.CHATMESSAGE, handleChatMessage)
        
        return () => {
            socket.off(SocketEvent.INCOMING_PRODUCER, handleChatMessage)
        }
    }, [socket, roomState.name])


    return {
        joinRoom,
        isConnected,
    };
};


