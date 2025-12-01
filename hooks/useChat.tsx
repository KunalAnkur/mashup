import { useEffect, useState, useCallback, useRef } from "react";
import { useSocket } from "@/context/SocketContext";
import { SocketEvent } from "@/types/socketEvents";
import {
  ChatMessage,
  TypingUser,
  SendMessageResponse,
  Reaction,
  ReactionType,
} from "@/types/chatTypes";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store";

interface UseChatParams {
  roomId: string | null;
  isHost: boolean;
}

export const useChat = ({ roomId, isHost }: UseChatParams) => {
  const { socket, isConnected } = useSocket("chat");
  const user = useSelector((state: RootState) => state.auth.user);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [isJoined, setIsJoined] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Refs to track typing timeout and join attempts
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTypingEmitRef = useRef<number>(0);
  const joinAttemptedRef = useRef<boolean>(false);
  const currentRoomRef = useRef<string | null>(null);

  /**
   * Join a chat room
   * ✅ CRITICAL: This should be called AFTER the global socket has joined the room
   */
  const joinChatRoom = useCallback(
    async (roomIdToJoin: string) => {
      if (!socket || !user || !roomIdToJoin) {
        console.log("Cannot join chat: missing socket, user, or roomId");
        return;
      }

      // Prevent duplicate joins for the same room
      if (currentRoomRef.current === roomIdToJoin && isJoined) {
        console.log("Already joined this room, skipping");
        return;
      }

      try {
        setIsLoading(true);
        console.log("Attempting to join chat room:", roomIdToJoin);

        // ✅ Add a delay to ensure global socket has joined first
        await new Promise((resolve) => setTimeout(resolve, 200));

        // Emit join event with acknowledgment
        const response = await socket.emitWithAck(SocketEvent.JOIN_CHAT_ROOM, {
          roomId: roomIdToJoin,
          userName: user?.name || user?.username || "User",
          userEmail: user?.email,
          userProfile: user?.profile,
          isHost: isHost,
        });

        if (response?.success) {
          // Set chat history from server response
          if (response.chatHistory && Array.isArray(response.chatHistory)) {
            setMessages(response.chatHistory);
          }
          setIsJoined(true);
          currentRoomRef.current = roomIdToJoin;
          joinAttemptedRef.current = true;
          console.log("Successfully joined chat room:", roomIdToJoin);
        } else {
          console.error("Failed to join chat room:", response?.error);
          setIsJoined(false);
          currentRoomRef.current = null;
        }
      } catch (error) {
        console.error("Error joining chat room:", error);
        setIsJoined(false);
        currentRoomRef.current = null;
      } finally {
        setIsLoading(false);
      }
    },
    [socket, user, isHost, isJoined]
  );

  /**
   * Send a chat message
   */
  const sendMessage = useCallback(
    async (message: string): Promise<SendMessageResponse> => {
      if (!socket || !roomId || !user || !message.trim()) {
        return { success: false, error: "Invalid message or not connected" };
      }

      try {
        const response = await socket.emitWithAck(
          SocketEvent.SEND_CHAT_MESSAGE,
          {
            roomId,
            message: message.trim(),
            userName: user?.name || user?.username || "User",
            userEmail: user?.email,
            userProfile: user?.profile,
            isHost: isHost,
          }
        );

        if (response?.success) {
          return {
            success: true,
            messageId: response.messageId,
            timestamp: response.timestamp,
          };
        } else {
          return {
            success: false,
            error: response?.error || "Failed to send message",
          };
        }
      } catch (error) {
        console.error("Error sending message:", error);
        return { success: false, error: "Error sending message" };
      }
    },
    [socket, roomId, user, isHost]
  );

  /**
   * Handle user typing indicator
   */
  const handleTyping = useCallback(() => {
    if (!socket || !roomId || !user) return;

    const now = Date.now();
    if (now - lastTypingEmitRef.current < 3000) {
      return;
    }

    lastTypingEmitRef.current = now;
    socket.emit(SocketEvent.USER_TYPING, {
      roomId,
      userName: user?.name || user?.username || "User",
    });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (socket && roomId) {
        socket.emit(SocketEvent.USER_STOPPED_TYPING, {
          roomId,
          userName: user?.name || user?.username || "User",
        });
      }
    }, 3000);
  }, [socket, roomId, user]);

  /**
   * Stop typing indicator
   */
  const stopTyping = useCallback(() => {
    if (!socket || !roomId || !user) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    socket.emit(SocketEvent.USER_STOPPED_TYPING, {
      roomId,
      userName: user?.name || user?.username || "User",
    });
  }, [socket, roomId, user]);

  /**
   * Get chat history
   */
  const getChatHistory = useCallback(async () => {
    if (!socket || !roomId) return;

    try {
      const response = await socket.emitWithAck(SocketEvent.GET_CHAT_HISTORY, {
        roomId,
      });

      if (response?.success && response.chatHistory) {
        setMessages(response.chatHistory);
      }
    } catch (error) {
      console.error("Error getting chat history:", error);
    }
  }, [socket, roomId]);

  /**
   * Send a reaction
   */
  const sendReaction = useCallback(
    (emoji: ReactionType) => {
      if (!socket || !roomId || !user) return;

      socket.emit(SocketEvent.SEND_REACTION, {
        roomId,
        emoji,
        userName: user?.name || user?.username || "User",
        userProfile: user?.profile,
      });
    },
    [socket, roomId, user]
  );

  /**
   * Leave chat room
   */
  const leaveChatRoom = useCallback(() => {
    if (!socket) return;

    console.log("Leaving chat room:", currentRoomRef.current);
    socket.emit(SocketEvent.LEAVE_CHAT_ROOM);
    setIsJoined(false);
    setMessages([]);
    setTypingUsers([]);
    setReactions([]);
    joinAttemptedRef.current = false;
    currentRoomRef.current = null;
  }, [socket]);

  // ✅ Auto-join chat room when conditions are met
  useEffect(() => {
    // Only join if:
    // 1. We have a roomId
    // 2. Socket is connected
    // 3. User exists
    // 4. Not already joined to this room
    // 5. Haven't attempted to join yet (prevents duplicate joins)
    if (
      roomId &&
      socket &&
      user &&
      isConnected &&
      !isJoined &&
      !joinAttemptedRef.current &&
      currentRoomRef.current !== roomId
    ) {
      console.log("Conditions met, joining chat room:", roomId);
      joinChatRoom(roomId);
    }

    // Cleanup on unmount or room change
    return () => {
      if (
        isJoined &&
        currentRoomRef.current &&
        currentRoomRef.current !== roomId
      ) {
        console.log("Room changed or unmounting, leaving chat");
        leaveChatRoom();
      }
    };
  }, [
    roomId,
    socket,
    user,
    isConnected,
    isJoined,
    joinChatRoom,
    leaveChatRoom,
  ]);

  // ✅ Reset join attempt when socket reconnects
  useEffect(() => {
    if (isConnected && roomId && !isJoined) {
      console.log("Socket reconnected, resetting join attempt");
      joinAttemptedRef.current = false;
    }
  }, [isConnected, roomId, isJoined]);

  // ✅ Socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = (messageData: ChatMessage) => {
      console.log("Received chat message:", messageData);

      if (!messageData || !messageData.message) {
        console.warn("Invalid message received:", messageData);
        return;
      }

      setMessages((prev) => {
        const exists = prev.some((msg) => msg.id === messageData.id);
        if (exists) return prev;
        return [...prev, messageData];
      });
    };

    const handleUserTyping = (data: TypingUser) => {
      if (!user || data.userId === socket.id) return;

      setTypingUsers((prev) => {
        const exists = prev.some((u) => u.userId === data.userId);
        if (exists) return prev;
        return [...prev, data];
      });
    };

    const handleUserStoppedTyping = (data: TypingUser) => {
      setTypingUsers((prev) => prev.filter((u) => u.userId !== data.userId));
    };

    const handleReceiveReaction = (data: { reaction: Reaction }) => {
      console.log("Received reaction:", data.reaction);

      setReactions((prev) => [...prev, data.reaction]);

      setTimeout(() => {
        setReactions((prev) => prev.filter((r) => r.id !== data.reaction.id));
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

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [socket, user]);

  return {
    messages,
    typingUsers,
    reactions,
    sendMessage,
    sendReaction,
    handleTyping,
    stopTyping,
    getChatHistory,
    joinChatRoom,
    leaveChatRoom,
    isJoined,
    isLoading,
    isConnected,
  };
};
