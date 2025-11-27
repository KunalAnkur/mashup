"use client";

import { createContext, useContext, ReactNode } from "react";
import { useChat } from "@/hooks/useChat";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import {
  ChatMessage,
  TypingUser,
  SendMessageResponse,
  Reaction,
  ReactionType,
} from "@/types/chatTypes";

interface ChatContextType {
  messages: ChatMessage[];
  typingUsers: TypingUser[];
  reactions: Reaction[];
  sendMessage: (message: string) => Promise<SendMessageResponse>;
  sendReaction: (emoji: ReactionType) => void;
  handleTyping: () => void;
  stopTyping: () => void;
  getChatHistory: () => Promise<void>;
  joinChatRoom: (roomId: string) => Promise<void>;
  leaveChatRoom: () => void;
  isJoined: boolean;
  isLoading: boolean;
  isConnected: boolean;
}

const ChatContext = createContext<ChatContextType | null>(null);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const roomId = useSelector((state: RootState) => state.room.roomId);
  const isHost = useSelector((state: RootState) => state.room.host);

  const chatData = useChat({ roomId, isHost });

  return <ChatContext.Provider value={chatData}>{children}</ChatContext.Provider>;
};

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChatContext must be used within a ChatProvider");
  }
  return context;
};

