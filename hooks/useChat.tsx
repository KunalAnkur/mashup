import { useEffect, useState, useCallback, useRef } from "react";
import { useSocket } from "@/context/SocketContext";
import { SocketEvent } from "@/types/socketEvents";
import {
  ChatMessage,
  TypingUser,
  SendMessageResponse,
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
  const [isJoined, setIsJoined] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Refs to track typing timeout
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTypingEmitRef = useRef<number>(0);

  /**
   * Join a chat room
   * This is called automatically when roomId is available
   */
  const joinChatRoom = useCallback(
    async (roomIdToJoin: string) => {
      if (!socket || !user || !roomIdToJoin) {
        return;
      }

      try {
        setIsLoading(true);

        // Emit join event with acknowledgment, including user info
        const response = await socket.emitWithAck(SocketEvent.JOIN_CHAT_ROOM, {
          roomId: roomIdToJoin,
          userName: user?.username || "User",
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
          console.log("Successfully joined chat room:", roomIdToJoin);
        } else {
          console.error("Failed to join chat room:", response?.error);
        }
      } catch (error) {
        console.error("Error joining chat room:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [socket, user, isHost]
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
        // Emit send message event with acknowledgment, including user info
        const response = await socket.emitWithAck(
          SocketEvent.SEND_CHAT_MESSAGE,
          {
            roomId,
            message: message.trim(),
            userName: user?.username || "User",
            userEmail: user?.email,
            userProfile: user?.profile,
            isHost: isHost,
          }
        );

        if (response?.success) {
          // Message will be added via RECEIVE_CHAT_MESSAGE event
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
   * Emits typing event and sets timeout to stop typing
   */
  const handleTyping = useCallback(() => {
    if (!socket || !roomId || !user) return;

    const now = Date.now();
    // Throttle typing events (only emit every 3 seconds)
    if (now - lastTypingEmitRef.current < 3000) {
      return;
    }

    lastTypingEmitRef.current = now;
    socket.emit(SocketEvent.USER_TYPING, {
      roomId,
      userName: user?.username || "User",
    });

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      if (socket && roomId) {
        socket.emit(SocketEvent.USER_STOPPED_TYPING, {
          roomId,
          userName: user?.username || "User",
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
      userName: user?.username || "User",
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
   * Leave chat room
   */
  const leaveChatRoom = useCallback(() => {
    if (!socket || !roomId) return;

    socket.emit(SocketEvent.LEAVE_CHAT_ROOM);
    setIsJoined(false);
    setMessages([]);
    setTypingUsers([]);
  }, [socket, roomId]);

  // Auto-join chat room when roomId is available
  useEffect(() => {
    if (roomId && socket && user && isConnected && !isJoined) {
      joinChatRoom(roomId);
    }

    // Cleanup on unmount or room change
    return () => {
      if (roomId && socket && isJoined) {
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

  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = (messageData: ChatMessage) => {
      // Debug: Log received message to see its structure
      console.log("Received chat message:", messageData);

      // Ensure message has required fields
      if (!messageData || !messageData.message) {
        console.warn("Invalid message received:", messageData);
        return;
      }

      // Add message to state
      setMessages((prev) => {
        // Check if message already exists (prevent duplicates)
        const exists = prev.some((msg) => msg.id === messageData.id);
        if (exists) return prev;
        return [...prev, messageData];
      });
    };

    const handleUserTyping = (data: TypingUser) => {
      // Don't show typing indicator for current user
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

    // Register all socket event listeners
    socket.on(SocketEvent.RECEIVE_CHAT_MESSAGE, handleReceiveMessage);
    socket.on(SocketEvent.USER_TYPING, handleUserTyping);
    socket.on(SocketEvent.USER_STOPPED_TYPING, handleUserStoppedTyping);

    // Cleanup all socket event listeners and typing timeout
    return () => {
      socket.off(SocketEvent.RECEIVE_CHAT_MESSAGE, handleReceiveMessage);
      socket.off(SocketEvent.USER_TYPING, handleUserTyping);
      socket.off(SocketEvent.USER_STOPPED_TYPING, handleUserStoppedTyping);

      // Cleanup typing timeout on unmount
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [socket, user]);

  return {
    messages,
    typingUsers,
    sendMessage,
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
