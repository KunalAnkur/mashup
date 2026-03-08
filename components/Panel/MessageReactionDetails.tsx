"use client";

import { MessageReaction, ReactionType } from "@/types/chatTypes";

interface MessageReactionDetailsProps {
  placement?: "top" | "bottom";
  reactions: MessageReaction[];
  focusedEmoji?: ReactionType | null;
  currentUserOwnerKey: string;
  getReactionOwnerKey: (reaction: MessageReaction) => string;
  currentUserLabel: string;
}

const MessageReactionDetails = ({
  placement = "bottom",
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
      className={`absolute left-0 z-[75] min-w-[9rem] max-w-[min(calc(100vw-4rem),13rem)] overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/95 shadow-2xl backdrop-blur-xl ${
        placement === "top" ? "bottom-full mb-2" : "top-full mt-2"
      }`}
    >
      <div className="max-h-36 overflow-y-auto px-1.5 py-1.5">
        <div className="flex flex-col gap-1">
          {orderedReactions.map((reaction) => {
            const isCurrentUser =
              getReactionOwnerKey(reaction) === currentUserOwnerKey;

            return (
              <div
                key={`${reaction.userId}-${reaction.emoji}-${reaction.reactedAt}`}
                className="flex items-center justify-between gap-2 rounded-xl px-2 py-1 text-[11px] text-white/85"
              >
                <span className="truncate">
                  {isCurrentUser ? currentUserLabel : reaction.userName}
                </span>
                <span className="shrink-0 text-[13px] leading-none">{reaction.emoji}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MessageReactionDetails;
