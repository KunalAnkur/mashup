import { ChatMessage, ReactionType } from "@/types/chatTypes";
import MessageReactionDetails from "../MessageReactionDetails";
import { ActiveReactionDetails } from "./types";
import { chatMessageReactionGroupsClass } from "./styles";
import { getReactionOwnerKey } from "./utils";

interface MessageReactionChipsProps {
  message: ChatMessage;
  reactionGroups: Array<{
    emoji: ReactionType;
    count: number;
    reactedByCurrentUser: boolean;
    reactors: string[];
    latestReactedAt: number;
  }>;
  activeReactionDetails: ActiveReactionDetails;
  currentReactionOwnerKey: string;
  onReactionDetailsToggle: (
    messageId: string,
    emoji: ReactionType,
    popupAlign: "start" | "end"
  ) => void;
  resolveReactionDetailsAlign: (triggerRect: DOMRect) => "start" | "end";
  t: (key: string) => string;
  tCommon: (key: string) => string;
}

export const MessageReactionChips = ({
  message,
  reactionGroups,
  activeReactionDetails,
  currentReactionOwnerKey,
  onReactionDetailsToggle,
  resolveReactionDetailsAlign,
  t,
  tCommon,
}: MessageReactionChipsProps) => {
  if (!reactionGroups.length) return null;
  
  const isDetailsOpen = activeReactionDetails?.messageId === message.id;

  return (
    <div
      className={`pointer-events-none absolute bottom-0 right-0 max-w-[min(calc(100%-0.5rem),calc(100vw-3rem))] translate-y-1/2 flex-col items-end ${
        isDetailsOpen ? "z-40" : "z-10"
      }`}
    >
      <div className={chatMessageReactionGroupsClass}>
        {reactionGroups.map((group) => (
          <div
            key={`${message.id}-${group.emoji}`}
            className="relative inline-flex"
          >
            <button
              type="button"
              onClick={(event) =>
                onReactionDetailsToggle(
                  message.id,
                  group.emoji,
                  resolveReactionDetailsAlign(
                    event.currentTarget.getBoundingClientRect()
                  )
                )
              }
              className={`pointer-events-auto inline-flex cursor-pointer items-center gap-1 rounded-full px-1 py-0.5 text-[10px] md:text-[11px] transition-colors duration-150 ${
                group.reactedByCurrentUser
                  ? "font-semibold text-white"
                  : "font-medium text-white/80 hover:text-white"
              }`}
              title={t("viewMessageReactions")}
            >
              <span className="leading-none">{group.emoji}</span>
              {group.count > 1 && <span>{group.count}</span>}
            </button>
            {isDetailsOpen && activeReactionDetails?.emoji === group.emoji && (
              <MessageReactionDetails
                align={activeReactionDetails.popupAlign}
                reactions={message.reactions || []}
                focusedEmoji={activeReactionDetails.emoji}
                currentUserOwnerKey={currentReactionOwnerKey}
                getReactionOwnerKey={getReactionOwnerKey}
                currentUserLabel={tCommon("you")}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// Made with Bob
