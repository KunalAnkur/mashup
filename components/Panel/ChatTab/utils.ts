import { ChatMessage, MessageReaction, ReactionType } from "@/types/chatTypes";
import { USER_COLOR_PALETTE } from "./constants";
import { UserColor } from "./types";

/**
 * Generate consistent color for a username using hash-based selection
 */
export const getUserColor = (username: string | undefined | null): UserColor => {
  const defaultColor = USER_COLOR_PALETTE[0];

  if (!username || typeof username !== "string" || username.length === 0) {
    return defaultColor;
  }

  const normalizedUsername = username.toLowerCase().trim();
  let hash = 0;
  
  for (let i = 0; i < normalizedUsername.length; i++) {
    const char = normalizedUsername.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  return USER_COLOR_PALETTE[Math.abs(hash) % USER_COLOR_PALETTE.length];
};

/**
 * Check if text contains only emojis
 */
export const isOnlyEmojis = (text: string): boolean => {
  const emojiRegex = /[\p{Emoji}\p{Emoji_Component}]/gu;
  const textWithoutEmojis = text.replace(emojiRegex, "").replace(/\s/g, "");
  return textWithoutEmojis.length === 0 && text.trim().length > 0;
};

/**
 * Get unique identifier for a reaction owner
 */
export const getReactionOwnerKey = (reaction: MessageReaction): string => {
  return reaction.userEmail?.trim().toLowerCase() || reaction.userId;
};

/**
 * Group message reactions by emoji
 */
export const getMessageReactionGroups = (
  message: ChatMessage,
  currentReactionOwnerKey: string
) => {
  const groupedReactions = new Map<
    ReactionType,
    {
      emoji: ReactionType;
      count: number;
      reactedByCurrentUser: boolean;
      reactors: string[];
      latestReactedAt: number;
    }
  >();

  (message.reactions || []).forEach((reaction) => {
    const existingGroup = groupedReactions.get(reaction.emoji);
    if (existingGroup) {
      existingGroup.count += 1;
      existingGroup.reactors.push(reaction.userName);
      existingGroup.reactedByCurrentUser =
        existingGroup.reactedByCurrentUser ||
        getReactionOwnerKey(reaction) === currentReactionOwnerKey;
      existingGroup.latestReactedAt = Math.max(
        existingGroup.latestReactedAt,
        reaction.reactedAt
      );
      return;
    }

    groupedReactions.set(reaction.emoji, {
      emoji: reaction.emoji,
      count: 1,
      reactedByCurrentUser:
        getReactionOwnerKey(reaction) === currentReactionOwnerKey,
      reactors: [reaction.userName],
      latestReactedAt: reaction.reactedAt,
    });
  });

  return Array.from(groupedReactions.values()).sort((left, right) => {
    if (left.reactedByCurrentUser !== right.reactedByCurrentUser) {
      return left.reactedByCurrentUser ? -1 : 1;
    }
    if (left.count !== right.count) {
      return right.count - left.count;
    }
    return right.latestReactedAt - left.latestReactedAt;
  });
};

/**
 * Get current user's reaction for a message
 */
export const getCurrentUserReaction = (
  message: ChatMessage,
  currentReactionOwnerKey: string
): ReactionType | null => {
  const reaction = (message.reactions || []).find(
    (entry) => getReactionOwnerKey(entry) === currentReactionOwnerKey
  );
  return reaction?.emoji || null;
};

/**
 * Check if container is scrolled near bottom
 */
export const isNearBottom = (container: HTMLDivElement, threshold: number = 24): boolean => {
  const distanceFromBottom =
    container.scrollHeight - container.scrollTop - container.clientHeight;
  return distanceFromBottom <= threshold;
};

// Made with Bob
