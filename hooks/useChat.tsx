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

    const isGenericName = (name?: string | null) => {
        if (!name) return true;
        const normalized = name.trim().toLowerCase();
        return (
            normalized.length === 0 ||
            normalized === "user" ||
            normalized === "unknown user" ||
            normalized === "guest"
        );
    };

    const getEmailPrefix = (email?: string) => {
        if (!email) return "";
        return email.split("@")[0]?.trim() || "";
    };

    const userName = (() => {
        const preferredUsername = user?.username?.trim();
        if (!isGenericName(preferredUsername)) return preferredUsername;

        const preferredName = user?.name?.trim();
        if (!isGenericName(preferredName)) return preferredName;

        const emailPrefix = getEmailPrefix(user?.email);
        if (!isGenericName(emailPrefix)) return emailPrefix;

        return "User";
    })();

    const sendMessage = useCallback(async (message: string): Promise<SendMessageResponse> => {
        if (!socket || !roomId || !user || !message.trim() || !enabled) {
            return { success: false, error: "Invalid message or not connected" };
        }

        const trimmedMessage = message.trim();
        const optimisticId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        const optimisticMessage: ChatMessage = {
            id: optimisticId,
            roomId,
            userId: socket.id || user.id,
            userName,
            userEmail: user?.email,
            userProfile: user?.profile,
            message: trimmedMessage,
            timestamp: Date.now(),
            isHost,
            type: "user",
        };

        setMessages(prev => [...prev, optimisticMessage]);

        try {
            const response = await socket.emitWithAck(SocketEvent.SEND_CHAT_MESSAGE, {
                roomId,
                message: trimmedMessage,
                userName,
                userEmail: user?.email,
                userProfile: user?.profile,
                isHost,
            });

            if (response?.success) {
                setMessages(prev =>
                    prev.map(msg =>
                        msg.id === optimisticId
                            ? {
                                ...msg,
                                id: response.messageId || msg.id,
                                timestamp: response.timestamp || msg.timestamp,
                            }
                            : msg
                    )
                );
                return { success: true, messageId: response.messageId, timestamp: response.timestamp };
            }

            setMessages(prev => prev.filter(msg => msg.id !== optimisticId));
            return { success: false, error: response?.error || "Failed to send message" };
        } catch {
            setMessages(prev => prev.filter(msg => msg.id !== optimisticId));
            return { success: false, error: "Error sending message" };
        }
    }, [socket, roomId, user, isHost, enabled, userName]);

    const handleTyping = useCallback(() => {
        if (!socket || !roomId || !user || !enabled) return;

        const now = Date.now();
        if (now - lastTypingEmitRef.current < 3000) return;

        lastTypingEmitRef.current = now;
        socket.emit(SocketEvent.USER_TYPING, {
            roomId,
            userName,
            userEmail: user?.email,
        });

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

        typingTimeoutRef.current = setTimeout(() => {
            socket?.emit(SocketEvent.USER_STOPPED_TYPING, {
                roomId,
                userName,
                userEmail: user?.email,
            });
        }, 3000);
    }, [socket, roomId, user, enabled, userName]);

    const stopTyping = useCallback(() => {
        if (!socket || !roomId || !user || !enabled) return;

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = null;
        }

        socket.emit(SocketEvent.USER_STOPPED_TYPING, {
            roomId,
            userName,
            userEmail: user?.email,
        });
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

                const optimisticMatchIndex = prev.findIndex((message) => {
                    if (!message.id.startsWith("temp-")) return false;
                    if (message.message !== data.message) return false;

                    const sameUserId = !!message.userId && !!data.userId && message.userId === data.userId;
                    const sameUserEmail =
                        !!message.userEmail &&
                        !!data.userEmail &&
                        message.userEmail.toLowerCase() === data.userEmail.toLowerCase();

                    return sameUserId || sameUserEmail;
                });

                if (optimisticMatchIndex !== -1) {
                    const next = [...prev];
                    next[optimisticMatchIndex] = {
                        ...next[optimisticMatchIndex],
                        ...data,
                    };
                    return next;
                }

                console.log("[useChat] Adding new message to state:", data);
                return [...prev, data];
            });
        };

        const handleUserTyping = (data: TypingUser) => {
            if (data.userId === socket.id) return;

            const emailPrefix = getEmailPrefix(data.userEmail);
            const resolvedName = !isGenericName(data.userName)
                ? data.userName
                : !isGenericName(emailPrefix)
                    ? emailPrefix
                    : "User";

            const typingUser: TypingUser = {
                ...data,
                userName: resolvedName,
            };
            setTypingUsers(prev => {
                const existingUser = prev.find(u => u.userId === data.userId);
                if (!existingUser) {
                    return [...prev, typingUser];
                }

                const shouldKeepExistingName =
                    !isGenericName(existingUser.userName) && isGenericName(typingUser.userName);
                if (shouldKeepExistingName || existingUser.userName === typingUser.userName) {
                    return prev;
                }

                return prev.map(u => (u.userId === data.userId ? { ...u, ...typingUser } : u));
            });
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

        return () => {
            socket.off(SocketEvent.RECEIVE_CHAT_MESSAGE, handleReceiveMessage);
            socket.off(SocketEvent.USER_TYPING, handleUserTyping);
            socket.off(SocketEvent.USER_STOPPED_TYPING, handleUserStoppedTyping);
            socket.off(SocketEvent.RECEIVE_REACTION, handleReceiveReaction);
            socket.off(SocketEvent.USERNAME_UPDATED, handleUsernameUpdated);

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
