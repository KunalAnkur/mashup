import { ChatMessage, ReactionType } from "@/types/chatTypes";
import { formatChatTime } from "@/utils/timeFormatter";
import MessageReactionPicker from "../MessageReactionPicker";
import { UserAvatar } from "./UserAvatar";
import { MessageBubbleActions } from "./MessageBubbleActions";
import { MessageReactionChips } from "./MessageReactionChips";
import { UserColor, MessageActionPlacement, MessageReactionPlacement, ActiveReactionDetails } from "./types";
import { chatMessageUserNameClass, chatMessageBubbleBaseClass, chatMessageTextClass, chatMessageTimestampClass } from "./styles";
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

  return (
    <div
      className={`relative flex items-start gap-2 md:gap-3 group ${
        hasActiveReactionPicker || hasActiveReactionDetails ? "z-30" : "z-0"
      } ${isGroupedMessage ? "mt-0" : "mt-1"}`}
    >
      <div className={`relative flex-shrink-0 ${isGroupedMessage ? "w-8 md:w-10" : ""}`}>
        {!isGroupedMessage && (
          <UserAvatar
            displayUserName={displayUserName}
            userProfile={message.userProfile}
            userColor={userColor}
            isCurrentUser={isCurrentUser}
          />
        )}
      </div>

      <div className="flex-1 min-w-0 flex flex-col gap-1 md:gap-1.5 items-start">
        {!isGroupedMessage && (
          <div className="flex items-baseline gap-1.5 md:gap-2 min-w-0 w-full">
            <span
              className={`${chatMessageUserNameClass} ${userColor.gradient}`}
              title={displayUserName}
            >
              {displayUserName}
            </span>
          </div>
        )}

        {onlyEmojis ? (
          <div
            ref={messageBubbleRef}
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
              <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${userColor.bg} rounded-lg blur-xl opacity-20`}></div>
              <p className={`relative text-3xl md:text-4xl leading-tight filter`}>
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
            <span className="pointer-events-none absolute -bottom-4 right-0 text-gray-500/60 text-[9px] md:text-[10px] font-medium opacity-60 group-hover/message:opacity-100 transition-opacity duration-200 whitespace-nowrap">
              {formatChatTime(message.timestamp)}
            </span>
          </div>
        ) : (
          <div
            ref={messageBubbleRef}
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

            <div className={`pointer-events-none absolute -inset-0.5 bg-gradient-to-br ${userColor.bg} rounded-xl md:rounded-2xl blur opacity-0 group-hover/message:opacity-20 transition-opacity duration-300`}></div>

            <div
              className={`${chatMessageBubbleBaseClass} ${isGroupedMessage
                  ? "rounded-lg md:rounded-xl mt-0"
                  : "rounded-xl md:rounded-2xl rounded-tl-sm"
                } ${isCurrentUser
                  ? `bg-gradient-to-br from-purple-600/15 via-pink-600/10 to-fuchsia-600/10 `
                  : "bg-gradient-to-br from-zinc-800/15 via-zinc-700/15 to-zinc-800/15 "
                }`}
            >
              <p className={chatMessageTextClass}>
                {message.message}
              </p>
              <div className={chatMessageTimestampClass}>
                {formatChatTime(message.timestamp)}
              </div>
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
