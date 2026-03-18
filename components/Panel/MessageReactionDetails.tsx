"use client";

import {
  appWhiteBorderClass,
  appWhiteEmphasisSurfaceClass,
} from "@/components/UI/classTokens";
import { MessageReaction, ReactionType } from "@/types/chatTypes";

const messageReactionDetailsSurfaceClass =
  `pointer-events-auto absolute top-full z-[90] mt-1 w-max min-w-[9rem] max-w-[min(calc(100vw-3rem),13rem)] overflow-hidden rounded-xl ${appWhiteBorderClass} bg-black shadow-[0_12px_28px_rgba(0,0,0,0.24)]`;
const messageReactionDetailsListClass =
  "max-h-[min(9rem,calc(100vh-8rem))] overflow-y-auto px-1 py-1";
const messageReactionDetailsItemClass =
  "flex items-center justify-between gap-2 rounded-lg px-2 py-1 text-[10px]";

interface MessageReactionDetailsProps {
  align?: "start" | "end";
  reactions: MessageReaction[];
  focusedEmoji?: ReactionType | null;
  currentUserOwnerKey: string;
  getReactionOwnerKey: (reaction: MessageReaction) => string;
  currentUserLabel: string;
}

const MessageReactionDetails = ({
  align = "start",
  reactions,
  focusedEmoji = null,
  currentUserOwnerKey,
  getReactionOwnerKey,
  currentUserLabel,
}: MessageReactionDetailsProps) => {
  const orderedReactions = [...reactions].sort((left, right) => {
    const leftFocused = focusedEmoji ? left.emoji === focusedEmoji : false;
    const rightFocused = focusedEmoji ? right.emoji === focusedEmoji : false;
    if (leftFocused !== rightFocused) {
      return leftFocused ? -1 : 1;
    }

    const leftCurrentUser = getReactionOwnerKey(left) === currentUserOwnerKey;
    const rightCurrentUser = getReactionOwnerKey(right) === currentUserOwnerKey;
    if (leftCurrentUser !== rightCurrentUser) {
      return leftCurrentUser ? -1 : 1;
    }

    return right.reactedAt - left.reactedAt;
  });

  return (
    <div
      className={`${messageReactionDetailsSurfaceClass} ${
        align === "end" ? "right-0" : "left-0"
      }`}
    >
      <div className={messageReactionDetailsListClass}>
        <div className="flex flex-col gap-0.5">
          {orderedReactions.map((reaction) => {
            const isCurrentUser =
              getReactionOwnerKey(reaction) === currentUserOwnerKey;
            const isFocusedReaction = focusedEmoji
              ? reaction.emoji === focusedEmoji
              : false;

            return (
              <div
                key={`${reaction.userId}-${reaction.emoji}-${reaction.reactedAt}`}
                className={`${messageReactionDetailsItemClass} ${
                  isFocusedReaction
                    ? appWhiteEmphasisSurfaceClass
                    : "text-white/82"
                }`}
              >
                <span className="truncate pr-1.5">
                  {isCurrentUser ? currentUserLabel : reaction.userName}
                </span>
                <span className="shrink-0 text-xs leading-none">{reaction.emoji}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MessageReactionDetails;
