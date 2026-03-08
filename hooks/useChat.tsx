import { useEffect, useState, useCallback, useRef } from "react";
import { useSocket } from "@/context/SocketContext";
import { SocketEvent } from "@/types/socketEvents";
import {
  ChatMessage,
  MessageReaction,
  MessageReactionsUpdatedPayload,
  PinnedChatMessage,
  PinMessageResponse,
  Reaction,
  ReactionType,
  SendMessageResponse,
  TypingUser,
} from "@/types/chatTypes";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store";

interface UseChatParams {
  roomId: string | null;
  isHost: boolean;
  enabled?: boolean;
}

const normalizeReactionOwnerKey = (reaction: {
  userId: string;
  userEmail?: string;
}): string => reaction.userEmail?.trim().toLowerCase() || reaction.userId;

const normalizeChatMessage = (message: ChatMessage): ChatMessage => ({
  ...message,
  reactions: Array.isArray(message.reactions) ? message.reactions : [],
});

const getNextMessageReactions = (
  existingReactions: MessageReaction[],
  nextReaction: MessageReaction
): MessageReaction[] => {
  const nextOwnerKey = normalizeReactionOwnerKey(nextReaction);
  const currentReactions = [...existingReactions];
  const existingIndex = currentReactions.findIndex(
    (reaction) => normalizeReactionOwnerKey(reaction) === nextOwnerKey
  );

  if (existingIndex === -1) {
    return [...currentReactions, nextReaction];
  }

  const existingReaction = currentReactions[existingIndex];
  if (existingReaction.emoji === nextReaction.emoji) {
    currentReactions.splice(existingIndex, 1);
    return currentReactions;
  }

  currentReactions[existingIndex] = nextReaction;
  return currentReactions;
};

const applyMessageReactionsUpdate = (
  messages: ChatMessage[],
  messageId: string,
  reactions: MessageReaction[]
): ChatMessage[] =>
  messages.map((message) =>
    message.id === messageId
      ? { ...message, reactions: Array.isArray(reactions) ? reactions : [] }
      : message
  );

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

  const userName = user?.username || user?.name || "User";

  const sendMessage = useCallback(async (message: string): Promise<SendMessageResponse> => {
    if (!socket || !roomId || !user || !message.trim() || !enabled) {
      return { success: false, error: "Invalid message or not connected" };
    }

    try {
      const response = await socket.emitWithAck(SocketEvent.SEND_CHAT_MESSAGE, {
        roomId,
        message: message.trim(),
        userName,
        userEmail: user.email,
        userProfile: user.profile,
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
      socket.emit(SocketEvent.USER_STOPPED_TYPING, { roomId, userName });
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
        setMessages(response.chatHistory.map(normalizeChatMessage));
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
      setMessages(chatHistory.map(normalizeChatMessage));
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
      userProfile: user.profile,
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

  const toggleMessageReaction = useCallback((messageId: string, emoji: ReactionType) => {
    if (!socket || !socket.id || !roomId || !user || !enabled || !messageId) return;

    const optimisticReaction: MessageReaction = {
      userId: socket.id,
      userName,
      userEmail: user.email,
      userProfile: user.profile,
      emoji,
      reactedAt: Date.now(),
    };

    setMessages((prev) =>
      prev.map((message) =>
        message.id === messageId
          ? {
              ...message,
              reactions: getNextMessageReactions(message.reactions || [], optimisticReaction),
            }
          : message
      )
    );

    socket.emit(SocketEvent.TOGGLE_MESSAGE_REACTION, {
      roomId,
      messageId,
      emoji,
    });
  }, [socket, roomId, user, enabled, userName]);

  useEffect(() => {
    if (!socket || !enabled) return;

    const handleReceiveMessage = (data: ChatMessage) => {
      if (!data?.message) {
        return;
      }

      const normalizedMessage = normalizeChatMessage(data);
      setMessages((prev) => {
        const exists = prev.some((message) => message.id === normalizedMessage.id);
        if (exists) {
          return prev;
        }

        return [...prev, normalizedMessage];
      });
    };

    const handleUserTyping = (data: TypingUser) => {
      if (data.userId === socket.id) return;

      const typingUser: TypingUser = {
        ...data,
        userName: data.userName || "User",
      };

      setTypingUsers((prev) =>
        prev.some((existingUser) => existingUser.userId === data.userId)
          ? prev
          : [...prev, typingUser]
      );
    };

    const handleUserStoppedTyping = (data: TypingUser) => {
      setTypingUsers((prev) => prev.filter((typingUser) => typingUser.userId !== data.userId));
    };

    const handleReceiveReaction = (data: { reaction: Reaction }) => {
      setReactions((prev) => [...prev, data.reaction]);
      setTimeout(() => {
        setReactions((prev) => prev.filter((reaction) => reaction.id !== data.reaction.id));
      }, 3000);
    };

    const handlePinnedMessageUpdated = (data: {
      roomId: string;
      pinnedMessage: PinnedChatMessage | null;
    }) => {
      if (!data || data.roomId !== roomId) return;
      setPinnedMessage(data.pinnedMessage || null);
    };

    const handleMessageReactionsUpdated = (data: MessageReactionsUpdatedPayload) => {
      if (data.roomId !== roomId) return;

      setMessages((prev) =>
        applyMessageReactionsUpdate(prev, data.messageId, data.reactions || [])
      );
    };

    const handleUsernameUpdated = (data: {
      socketId: string;
      username?: string;
      name?: string;
      profile?: string;
    }) => {
      const newUsername = data.username || data.name;
      if (!newUsername) return;

      setMessages((prev) =>
        prev.map((message) => {
          const nextReactions = Array.isArray(message.reactions) ? message.reactions : [];
          const nextMessage: ChatMessage = {
            ...message,
            reactions: nextReactions,
          };

          if (nextMessage.userId === data.socketId) {
            nextMessage.userName = newUsername;
            nextMessage.userProfile = data.profile || nextMessage.userProfile;
          }

          if (nextReactions.length) {
            nextMessage.reactions = nextReactions.map((reaction) =>
              reaction.userId === data.socketId
                ? {
                    ...reaction,
                    userName: newUsername,
                    userProfile: data.profile || reaction.userProfile,
                  }
                : reaction
            );
          }

          return nextMessage;
        })
      );

      setTypingUsers((prev) =>
        prev.map((typingUser) =>
          typingUser.userId === data.socketId
            ? { ...typingUser, userName: newUsername }
            : typingUser
        )
      );
    };

    socket.on(SocketEvent.RECEIVE_CHAT_MESSAGE, handleReceiveMessage);
    socket.on(SocketEvent.USER_TYPING, handleUserTyping);
    socket.on(SocketEvent.USER_STOPPED_TYPING, handleUserStoppedTyping);
    socket.on(SocketEvent.RECEIVE_REACTION, handleReceiveReaction);
    socket.on(SocketEvent.PINNED_CHAT_MESSAGE_UPDATED, handlePinnedMessageUpdated);
    socket.on(SocketEvent.MESSAGE_REACTIONS_UPDATED, handleMessageReactionsUpdated);
    socket.on(SocketEvent.USERNAME_UPDATED, handleUsernameUpdated);

    return () => {
      socket.off(SocketEvent.RECEIVE_CHAT_MESSAGE, handleReceiveMessage);
      socket.off(SocketEvent.USER_TYPING, handleUserTyping);
      socket.off(SocketEvent.USER_STOPPED_TYPING, handleUserStoppedTyping);
      socket.off(SocketEvent.RECEIVE_REACTION, handleReceiveReaction);
      socket.off(SocketEvent.PINNED_CHAT_MESSAGE_UPDATED, handlePinnedMessageUpdated);
      socket.off(SocketEvent.MESSAGE_REACTIONS_UPDATED, handleMessageReactionsUpdated);
      socket.off(SocketEvent.USERNAME_UPDATED, handleUsernameUpdated);

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
    toggleMessageReaction,
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
