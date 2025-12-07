import { useEffect, useState, useCallback, useRef } from "react";
import { useSocket } from "@/context/SocketContext";
import { SocketEvent } from "@/types/socketEvents";
import { ChatMessage, TypingUser, SendMessageResponse, Reaction, ReactionType } from "@/types/chatTypes";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store";

interface UseChatParams {
    roomId: string | null;
    isHost: boolean;
    enabled?: boolean;
}

export const useChat = ({ roomId, isHost, enabled = true }: UseChatParams) => {
    const { socket, isConnected } = useSocket();
    const user = useSelector((state: RootState) => state.auth.user);

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
    const [reactions, setReactions] = useState<Reaction[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const lastTypingEmitRef = useRef(0);

    const userName = user?.name || user?.username || "User";

    const sendMessage = useCallback(async (message: string): Promise<SendMessageResponse> => {
        if (!socket || !roomId || !user || !message.trim() || !enabled) {
            return { success: false, error: "Invalid message or not connected" };
        }

        try {
            const response = await socket.emitWithAck(SocketEvent.SEND_CHAT_MESSAGE, {
                roomId,
                message: message.trim(),
                userName,
                userEmail: user?.email,
                userProfile: user?.profile,
                isHost,
            });

            return response?.success
                ? { success: true, messageId: response.messageId, timestamp: response.timestamp }
                : { success: false, error: response?.error || "Failed to send message" };
        } catch {
            return { success: false, error: "Error sending message" };
        }
    }, [socket, roomId, user, isHost, enabled, userName]);

    const handleTyping = useCallback(() => {
        if (!socket || !roomId || !user || !enabled) return;

        const now = Date.now();
        if (now - lastTypingEmitRef.current < 3000) return;

        lastTypingEmitRef.current = now;
        socket.emit(SocketEvent.USER_TYPING, { roomId, userName });

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

        typingTimeoutRef.current = setTimeout(() => {
            socket?.emit(SocketEvent.USER_STOPPED_TYPING, { roomId, userName });
        }, 3000);
    }, [socket, roomId, user, enabled, userName]);

    const stopTyping = useCallback(() => {
        if (!socket || !roomId || !user || !enabled) return;

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = null;
        }

        socket.emit(SocketEvent.USER_STOPPED_TYPING, { roomId, userName });
    }, [socket, roomId, user, enabled, userName]);

    const getChatHistory = useCallback(async () => {
        if (!socket || !roomId || !enabled) return;

        setIsLoading(true);
        try {
            const response = await socket.emitWithAck(SocketEvent.GET_CHAT_HISTORY, { roomId });
            if (response?.success && response.chatHistory) {
                setMessages(response.chatHistory);
            }
        } finally {
            setIsLoading(false);
        }
    }, [socket, roomId, enabled]);

    const setInitialChatHistory = useCallback((chatHistory: ChatMessage[]) => {
        if (Array.isArray(chatHistory) && chatHistory.length) {
            setMessages(chatHistory);
        }
    }, []);

    const sendReaction = useCallback((emoji: ReactionType) => {
        if (!socket || !roomId || !user || !enabled) return;

        socket.emit(SocketEvent.SEND_REACTION, {
            roomId,
            emoji,
            userName,
            userProfile: user?.profile,
        });
    }, [socket, roomId, user, enabled, userName]);

    // Socket events
    useEffect(() => {
        if (!socket || !enabled) return;

        const handleReceiveMessage = (data: ChatMessage) => {
            if (!data?.message) return;
            setMessages(prev => prev.some(m => m.id === data.id) ? prev : [...prev, data]);
        };

        const handleUserTyping = (data: TypingUser) => {
            if (data.userId === socket.id) return;
            setTypingUsers(prev => prev.some(u => u.userId === data.userId) ? prev : [...prev, data]);
        };

        const handleUserStoppedTyping = (data: TypingUser) => {
            setTypingUsers(prev => prev.filter(u => u.userId !== data.userId));
        };

        const handleReceiveReaction = (data: { reaction: Reaction }) => {
            setReactions(prev => [...prev, data.reaction]);
            setTimeout(() => {
                setReactions(prev => prev.filter(r => r.id !== data.reaction.id));
            }, 3000);
        };

        socket.on(SocketEvent.RECEIVE_CHAT_MESSAGE, handleReceiveMessage);
        socket.on(SocketEvent.USER_TYPING, handleUserTyping);
        socket.on(SocketEvent.USER_STOPPED_TYPING, handleUserStoppedTyping);
        socket.on(SocketEvent.RECEIVE_REACTION, handleReceiveReaction);

        return () => {
            socket.off(SocketEvent.RECEIVE_CHAT_MESSAGE, handleReceiveMessage);
            socket.off(SocketEvent.USER_TYPING, handleUserTyping);
            socket.off(SocketEvent.USER_STOPPED_TYPING, handleUserStoppedTyping);
            socket.off(SocketEvent.RECEIVE_REACTION, handleReceiveReaction);

            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        };
    }, [socket, enabled]);

    return {
        messages,
        typingUsers,
        reactions,
        sendMessage,
        sendReaction,
        handleTyping,
        stopTyping,
        getChatHistory,
        setInitialChatHistory,
        isJoined: enabled && !!roomId && isConnected,
        isLoading,
        isConnected,
    };
};
