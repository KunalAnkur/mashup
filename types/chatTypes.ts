// Types for chat functionality

export interface ChatMessage {
  id: string;
  roomId: string;
  userId: string;
  userName: string;
  userEmail?: string;
  userProfile?: string; // Profile picture URL
  message: string;
  timestamp: number;
  isHost: boolean;
  type?: "user" | "system"; // System messages for join/leave notifications
}

export interface TypingUser {
  userId: string;
  userName: string;
  roomId: string;
}

export interface ChatHistoryResponse {
  success: boolean;
  roomId: string;
  chatHistory: ChatMessage[];
}

export interface SendMessageResponse {
  success: boolean;
  messageId?: string;
  timestamp?: number;
  error?: string;
}
