"use client";

import { createContext, useContext, ReactNode, useEffect } from "react";
import { useChat } from "@/hooks/useChat";
import { useRoomContext } from "@/context/RoomContext";
import { ChatMessage, TypingUser, SendMessageResponse, Reaction, ReactionType } from "@/types/chatTypes";

interface ChatContextType {
    messages: ChatMessage[];
    typingUsers: TypingUser[];
    reactions: Reaction[];
    sendMessage: (message: string) => Promise<SendMessageResponse>;
    sendReaction: (emoji: ReactionType) => void;
    handleTyping: () => void;
    stopTyping: () => void;
    getChatHistory: () => Promise<void>;
    setInitialChatHistory?: (chatHistory: ChatMessage[]) => void;
    isJoined: boolean;
    isLoading: boolean;
    isConnected: boolean;
}

const ChatContext = createContext<ChatContextType | null>(null);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
    const { roomId, isHost, isJoined: roomJoined, joinResponse } = useRoomContext();

    const chatData = useChat({
        roomId,
        isHost,
        enabled: roomJoined,
    });

    // Load chat history from join response
    useEffect(() => {
        if (joinResponse?.chatHistory?.length && roomJoined) {
            chatData.setInitialChatHistory?.(joinResponse.chatHistory);
        }
    }, [joinResponse?.chatHistory, roomJoined, chatData.setInitialChatHistory]);

    return <ChatContext.Provider value={chatData}>{children}</ChatContext.Provider>;
};

export const useChatContext = () => {
    const context = useContext(ChatContext);
    if (!context) {
        throw new Error("useChatContext must be used within a ChatProvider");
    }
    return context;
};
