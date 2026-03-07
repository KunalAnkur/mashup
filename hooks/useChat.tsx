import { useEffect, useState, useCallback, useRef } from "react";
import { useSocket } from "@/context/SocketContext";
import { SocketEvent } from "@/types/socketEvents";
import {
    ChatMessage,
    TypingUser,
    SendMessageResponse,
    Reaction,
    ReactionType,
    PinnedChatMessage,
    PinMessageResponse,
} from "@/types/chatTypes";
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
    const [pinnedMessage, setPinnedMessage] = useState<PinnedChatMessage | null>(null);
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
            if (response?.success) {
                setPinnedMessage(response.pinnedMessage || null);
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

    const setInitialPinnedMessage = useCallback((nextPinnedMessage: PinnedChatMessage | null) => {
        setPinnedMessage(nextPinnedMessage || null);
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

    const pinMessage = useCallback(async (messageId: string): Promise<PinMessageResponse> => {
        if (!socket || !roomId || !user || !enabled || !messageId) {
            return { success: false, error: "Invalid pin request or not connected" };
        }

        try {
            const response = await socket.emitWithAck(SocketEvent.PIN_CHAT_MESSAGE, {
                roomId,
                messageId,
            });

            return response?.success
                ? { success: true, roomId: response.roomId, pinnedMessage: response.pinnedMessage || null }
                : { success: false, error: response?.error || "Failed to pin message" };
        } catch {
            return { success: false, error: "Error pinning message" };
        }
    }, [socket, roomId, user, enabled]);

    const unpinMessage = useCallback(async (): Promise<PinMessageResponse> => {
        if (!socket || !roomId || !user || !enabled) {
            return { success: false, error: "Invalid unpin request or not connected" };
        }

        try {
            const response = await socket.emitWithAck(SocketEvent.UNPIN_CHAT_MESSAGE, {
                roomId,
            });

            return response?.success
                ? { success: true, roomId: response.roomId, pinnedMessage: null }
                : { success: false, error: response?.error || "Failed to unpin message" };
        } catch {
            return { success: false, error: "Error unpinning message" };
        }
    }, [socket, roomId, user, enabled]);

    // Socket events
    useEffect(() => {
        if (!socket || !enabled) return;

        const handleReceiveMessage = (data: ChatMessage) => {
            console.log("[useChat] Received message:", data);
            if (!data?.message) {
                console.warn("[useChat] Message missing message field:", data);
                return;
            }
            setMessages(prev => {
                const exists = prev.some(m => m.id === data.id);
                if (exists) {
                    console.log("[useChat] Message already exists, skipping:", data.id);
                    return prev;
                }
                console.log("[useChat] Adding new message to state:", data);
                return [...prev, data];
            });
        };

        const handleUserTyping = (data: TypingUser) => {
            if (data.userId === socket.id) return;
            // Ensure userName is set, fallback to "User" if missing
            const typingUser: TypingUser = {
                ...data,
                userName: data.userName || "User",
            };
            setTypingUsers(prev => prev.some(u => u.userId === data.userId) ? prev : [...prev, typingUser]);
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

        const handlePinnedMessageUpdated = (data: { roomId: string; pinnedMessage: PinnedChatMessage | null }) => {
            if (!data || data.roomId !== roomId) return;
            setPinnedMessage(data.pinnedMessage || null);
        };

        const handleUsernameUpdated = (data: { socketId: string; username?: string; name?: string; profile?: string }) => {
            // Determine the new username to use (prioritize username over name)
            const newUsername = data.username || data.name;
            
            if (!newUsername) return; // Skip if no username provided
            
            // Update all messages from this user with the new username
            setMessages(prev => prev.map(msg => {
                if (msg.userId === data.socketId) {
                    return {
                        ...msg,
                        userName: newUsername,
                        userProfile: data.profile || msg.userProfile,
                    };
                }
                return msg;
            }));

            // Update typing users with new username
            setTypingUsers(prev => prev.map(typingUser => {
                if (typingUser.userId === data.socketId) {
                    return {
                        ...typingUser,
                        userName: newUsername,
                    };
                }
                return typingUser;
            }));
        };

        socket.on(SocketEvent.RECEIVE_CHAT_MESSAGE, handleReceiveMessage);
        socket.on(SocketEvent.USER_TYPING, handleUserTyping);
        socket.on(SocketEvent.USER_STOPPED_TYPING, handleUserStoppedTyping);
        socket.on(SocketEvent.RECEIVE_REACTION, handleReceiveReaction);
        socket.on(SocketEvent.USERNAME_UPDATED, handleUsernameUpdated);
        socket.on(SocketEvent.PINNED_CHAT_MESSAGE_UPDATED, handlePinnedMessageUpdated);

        return () => {
            socket.off(SocketEvent.RECEIVE_CHAT_MESSAGE, handleReceiveMessage);
            socket.off(SocketEvent.USER_TYPING, handleUserTyping);
            socket.off(SocketEvent.USER_STOPPED_TYPING, handleUserStoppedTyping);
            socket.off(SocketEvent.RECEIVE_REACTION, handleReceiveReaction);
            socket.off(SocketEvent.USERNAME_UPDATED, handleUsernameUpdated);
            socket.off(SocketEvent.PINNED_CHAT_MESSAGE_UPDATED, handlePinnedMessageUpdated);

            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        };
    }, [socket, enabled, roomId]);

    useEffect(() => {
        if (!enabled || !roomId) {
            setPinnedMessage(null);
        }
    }, [enabled, roomId]);

    return {
        messages,
        typingUsers,
        reactions,
        pinnedMessage,
        sendMessage,
        sendReaction,
        pinMessage,
        unpinMessage,
        handleTyping,
        stopTyping,
        getChatHistory,
        setInitialChatHistory,
        setInitialPinnedMessage,
        isJoined: enabled && !!roomId && isConnected,
        isLoading,
        isConnected,
    };
};
