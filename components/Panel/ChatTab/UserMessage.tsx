import { isMobile } from "react-device-detect";
import { ChatMessage, ReactionType } from "@/types/chatTypes";
import { formatChatTime } from "@/utils/timeFormatter";
import MessageReactionPicker from "../MessageReactionPicker";
import { UserAvatar } from "./UserAvatar";
import { MessageBubbleActions } from "./MessageBubbleActions";
import { MessageReactionChips } from "./MessageReactionChips";
import { UserColor, MessageActionPlacement, MessageReactionPlacement, ActiveReactionDetails } from "./types";
import {
  chatMessageUserNameClass,
  chatMessageBubbleBaseClass,
  chatMessageTextClass,
  chatMessageHeaderTimestampClass,
  chatMessageGutterTimestampClass,
} from "./styles";
import { isOnlyEmojis, getMessageReactionGroups } from "./utils";

interface UserMessageProps {
  message: ChatMessage;
  displayUserName: string;
  userColor: UserColor;
  isCurrentUser: boolean;
  isGroupedMessage: boolean;
  showPinAction: boolean;
  canPinMessage: boolean;
  isPinnedMessage: boolean;
  pinButtonTitle: string;
  hasActiveReactionPicker: boolean;
  hasActiveReactionDetails: boolean;
  selectedMessageReaction: ReactionType | null;
  activeReactionPlacement: MessageReactionPlacement;
  activeReactionDetails: ActiveReactionDetails;
  messageActionPlacements: Record<string, MessageActionPlacement>;
  isJoined: boolean;
  pinActionLoadingId: string | null;
  currentReactionOwnerKey: string;
  actionsRevealed: boolean;
  onToggleActions: (messageId: string) => void;
  onReactionPickerToggle: (messageId: string) => void;
  onPinMessage: (message: ChatMessage) => void;
  onMessageReactionSelect: (messageId: string, emoji: ReactionType) => void;
  onReactionDetailsToggle: (
    messageId: string,
    emoji: ReactionType,
    popupAlign: "start" | "end"
  ) => void;
  resolveReactionDetailsAlign: (triggerRect: DOMRect) => "start" | "end";
  messageBubbleRef: (element: HTMLDivElement | null) => void;
  t: (key: string) => string;
  tCommon: (key: string) => string;
}

export const UserMessage = ({
  message,
  displayUserName,
  userColor,
  isCurrentUser,
  isGroupedMessage,
  showPinAction,
  canPinMessage,
  isPinnedMessage,
  pinButtonTitle,
  hasActiveReactionPicker,
  hasActiveReactionDetails,
  selectedMessageReaction,
  activeReactionPlacement,
  activeReactionDetails,
  messageActionPlacements,
  isJoined,
  pinActionLoadingId,
  currentReactionOwnerKey,
  actionsRevealed,
  onToggleActions,
  onReactionPickerToggle,
  onPinMessage,
  onMessageReactionSelect,
  onReactionDetailsToggle,
  resolveReactionDetailsAlign,
  messageBubbleRef,
  t,
  tCommon,
}: UserMessageProps) => {
  const onlyEmojis = isOnlyEmojis(message.message);
  const reactionGroups = getMessageReactionGroups(message, currentReactionOwnerKey);
  const actionPlacement = messageActionPlacements[message.id] || "side";

  // Touch devices have no hover, so the react/pin bar is revealed by tapping the message.
  const showActions = actionsRevealed || hasActiveReactionPicker;
  const handleBubbleTap = isMobile
    ? (event: React.MouseEvent<HTMLDivElement>) => {
        if ((event.target as HTMLElement).closest("button, a")) return;
        onToggleActions(message.id);
      }
    : undefined;

  return (
    <div
      className={`relative flex items-start gap-2 md:gap-3 group ${
        hasActiveReactionPicker || hasActiveReactionDetails ? "z-30" : "z-0"
      } ${isGroupedMessage ? "mt-0.5" : "mt-2"}`}
    >
      <div className={`relative flex-shrink-0 ${isGroupedMessage ? "w-8 md:w-10" : ""}`}>
        {!isGroupedMessage ? (
          <UserAvatar
            displayUserName={displayUserName}
            userProfile={message.userProfile}
            userColor={userColor}
            isCurrentUser={isCurrentUser}
          />
        ) : (
          <span className={chatMessageGutterTimestampClass}>
            {formatChatTime(message.timestamp)}
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0 flex flex-col gap-1 md:gap-1.5 items-start">
        {!isGroupedMessage && (
          <div className="flex items-baseline gap-2 min-w-0 w-full">
            <span
              className={`${chatMessageUserNameClass} ${userColor.text}`}
              title={displayUserName}
            >
              {displayUserName}
            </span>
            <span className={chatMessageHeaderTimestampClass}>
              {formatChatTime(message.timestamp)}
            </span>
          </div>
        )}

        {onlyEmojis ? (
          <div
            ref={messageBubbleRef}
            onClick={handleBubbleTap}
            className={`relative isolate group/message inline-flex max-w-full flex-col ${
              isGroupedMessage ? "p-0.5 mt-0" : "p-0.5"
            }`}
          >
            <MessageBubbleActions
              message={message}
              actionPlacement={actionPlacement}
              showPinAction={showPinAction}
              canPinMessage={canPinMessage}
              isPinnedMessage={isPinnedMessage}
              pinButtonTitle={pinButtonTitle}
              isJoined={isJoined}
              pinActionLoadingId={pinActionLoadingId}
              revealed={showActions}
              onReactionPickerToggle={onReactionPickerToggle}
              onPinMessage={onPinMessage}
              t={t}
            />
            {hasActiveReactionPicker && (
              <MessageReactionPicker
                placement={activeReactionPlacement}
                selectedEmoji={selectedMessageReaction}
                onSelect={(emoji) => onMessageReactionSelect(message.id, emoji)}
              />
            )}

            <div className="relative z-0 inline-block">
              <p className="relative text-3xl md:text-4xl leading-tight">
                {message.message}
              </p>
            </div>
            <MessageReactionChips
              message={message}
              reactionGroups={reactionGroups}
              activeReactionDetails={activeReactionDetails}
              currentReactionOwnerKey={currentReactionOwnerKey}
              onReactionDetailsToggle={onReactionDetailsToggle}
              resolveReactionDetailsAlign={resolveReactionDetailsAlign}
              t={t}
              tCommon={tCommon}
            />
          </div>
        ) : (
          <div
            ref={messageBubbleRef}
            onClick={handleBubbleTap}
            className="relative isolate group/message inline-flex max-w-full flex-col"
          >
            <MessageBubbleActions
              message={message}
              actionPlacement={actionPlacement}
              showPinAction={showPinAction}
              canPinMessage={canPinMessage}
              isPinnedMessage={isPinnedMessage}
              pinButtonTitle={pinButtonTitle}
              isJoined={isJoined}
              pinActionLoadingId={pinActionLoadingId}
              revealed={showActions}
              onReactionPickerToggle={onReactionPickerToggle}
              onPinMessage={onPinMessage}
              t={t}
            />
            {hasActiveReactionPicker && (
              <MessageReactionPicker
                placement={activeReactionPlacement}
                selectedEmoji={selectedMessageReaction}
                onSelect={(emoji) => onMessageReactionSelect(message.id, emoji)}
              />
            )}

            <div
              className={`${chatMessageBubbleBaseClass} ${isGroupedMessage
                  ? "rounded-lg md:rounded-xl mt-0"
                  : "rounded-xl md:rounded-2xl rounded-tl-sm"
                } ${isCurrentUser
                  ? "bg-white/[0.08]"
                  : "bg-white/[0.04]"
                }`}
            >
              <p className={chatMessageTextClass}>
                {message.message}
              </p>
            </div>
            <MessageReactionChips
              message={message}
              reactionGroups={reactionGroups}
              activeReactionDetails={activeReactionDetails}
              currentReactionOwnerKey={currentReactionOwnerKey}
              onReactionDetailsToggle={onReactionDetailsToggle}
              resolveReactionDetailsAlign={resolveReactionDetailsAlign}
              t={t}
              tCommon={tCommon}
            />
          </div>
        )}
      </div>
    </div>
  );
};

// Made with Bob
