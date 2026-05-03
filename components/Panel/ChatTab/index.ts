// Main component
export { default } from "./ChatTab";

// Sub-components
export { SystemMessage } from "./SystemMessage";
export { UserMessage } from "./UserMessage";
export { UserAvatar } from "./UserAvatar";
export { MessageBubbleActions } from "./MessageBubbleActions";
export { MessageReactionChips } from "./MessageReactionChips";
export { StatusBanner } from "./StatusBanner";
export { PinnedMessageBanner } from "./PinnedMessageBanner";
export { TypingIndicator } from "./TypingIndicator";
export { EmptyState } from "./EmptyState";
export { ChatInput } from "./ChatInput";
export { ReactionBar } from "./ReactionBar";

// Types
export type {
  MessageReactionPlacement,
  MessageActionPlacement,
  ActiveReactionDetails,
  UserColor,
} from "./types";

// Constants
export * from "./constants";

// Utilities
export * from "./utils";
export * from "./systemMessageUtils";

// Styles
export * from "./styles";

// Hooks
export { useChatMessages } from "./hooks/useChatMessages";
export { useMessagePlacement } from "./hooks/useMessagePlacement";

// Made with Bob
