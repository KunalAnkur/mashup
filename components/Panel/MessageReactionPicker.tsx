"use client";

import {
  appBorderedFrostedSurfaceClass,
} from "@/components/UI/classTokens";
import { ReactionType } from "@/types/chatTypes";

const messageReactionPickerSurfaceClass =
  `absolute left-0 z-[70] flex max-w-[min(calc(100vw-4rem),18rem)] items-center gap-1 overflow-x-auto rounded-full ${appBorderedFrostedSurfaceClass} bg-zinc-950/95 px-2 py-1.5 shadow-2xl scrollbar-hide`;
const messageReactionPickerButtonClass =
  "flex h-8 w-8 items-center justify-center rounded-full text-lg transition-all duration-150";

export const QUICK_MESSAGE_REACTIONS: ReactionType[] = [
  "👍",
  "❤️",
  "😂",
  "😮",
  "😢",
  "🙏",
];

interface MessageReactionPickerProps {
  placement?: "top" | "bottom";
  selectedEmoji?: ReactionType | null;
  onSelect: (emoji: ReactionType) => void;
}

const MessageReactionPicker = ({
  placement = "top",
  selectedEmoji = null,
  onSelect,
}: MessageReactionPickerProps) => (
  <div
    className={`${messageReactionPickerSurfaceClass} ${
      placement === "bottom"
        ? "top-full mt-2"
        : "top-0 -translate-y-[calc(100%+0.5rem)]"
    }`}
  >
    {QUICK_MESSAGE_REACTIONS.map((emoji) => {
      const isSelected = selectedEmoji === emoji;

      return (
        <button
          key={emoji}
          type="button"
          onClick={() => onSelect(emoji)}
          className={`${messageReactionPickerButtonClass} ${
            isSelected
              ? "bg-white/14 shadow-[0_0_0_1px_rgba(255,255,255,0.12)]"
              : "hover:bg-white/8"
          }`}
          aria-label={emoji}
          title={emoji}
        >
          <span className="leading-none">{emoji}</span>
        </button>
      );
    })}
  </div>
);

export default MessageReactionPicker;
