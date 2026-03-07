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
  userEmail?: string;
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

// Reaction types - All 60 available animated emojis
export type ReactionType = 
  | "😍" | "😡" | "😭" | "😂" | "🤯" | "🔥"
  | "😊" | "😢" | "😮" | "🤔" | "😎" | "🥳" | "😴" | "🤗"
  | "❤️" | "💔" | "😘" | "🥰" | "😜" | "😇" | "🤩" | "😱" | "🥺" | "😳" | "🙄" | "😬" | "🤐" | "🤢" | "🤮" | "🤧" | "😷" | "🤒" | "😈" | "👻" | "💀" | "🤡"
  | "👍" | "👎" | "👏" | "🙏" | "💪" | "✌️" | "🤞" | "🤟" | "🤘" | "👌" | "🤝" | "✋" | "👋" | "🙌" | "👊"
  | "🎉" | "💯" | "⚡" | "⭐" | "✨" | "💥" | "💫" | "🎊" | "🎈";

export interface Reaction {
  id: string;
  roomId: string;
  userId: string;
  userName: string;
  userProfile?: string;
  emoji: ReactionType;
  timestamp: number;
}

export interface SendReactionPayload {
  roomId: string;
  userId: string;
  userName: string;
  userProfile?: string;
  emoji: ReactionType;
}

export interface ReceiveReactionPayload {
  reaction: Reaction;
}
