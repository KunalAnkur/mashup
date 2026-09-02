import { ReactionType } from "@/types/chatTypes";

export type MessageReactionPlacement = "top" | "bottom";
export type MessageActionPlacement = "side" | "top";

export type ActiveReactionDetails = {
  messageId: string;
  emoji: ReactionType;
  popupAlign: "start" | "end";
} | null;

export type UserColor = {
  gradient: string;
  bg: string;
  text: string;
};

// Made with Bob
