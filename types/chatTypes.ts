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
  reactions: MessageReaction[];
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

export interface PinnedChatMessage extends ChatMessage {
  pinnedAt: number;
  pinnedByUserId: string;
  pinnedByUserName: string;
}

export interface PinMessageResponse {
  success: boolean;
  roomId?: string;
  pinnedMessage?: PinnedChatMessage | null;
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

export interface MessageReaction {
  userId: string;
  userName: string;
  userEmail?: string;
  userProfile?: string;
  emoji: ReactionType;
  reactedAt: number;
}

export interface MessageReactionsUpdatedPayload {
  roomId: string;
  messageId: string;
  reactions: MessageReaction[];
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
