"use client";

import { ReactionType } from "@/types/chatTypes";

export const QUICK_MESSAGE_REACTIONS: ReactionType[] = [
  "👍",
  "❤️",
  "😂",
  "😮",
  "😢",
  "🙏",
];

interface MessageReactionPickerProps {
  selectedEmoji?: ReactionType | null;
  onSelect: (emoji: ReactionType) => void;
}

const MessageReactionPicker = ({
  selectedEmoji = null,
  onSelect,
}: MessageReactionPickerProps) => (
  <div
    className="absolute left-0 top-0 z-30 flex max-w-[min(calc(100vw-4rem),18rem)] -translate-y-[calc(100%+0.5rem)] items-center gap-1 overflow-x-auto rounded-full border border-white/10 bg-zinc-950/90 px-2 py-1.5 shadow-2xl backdrop-blur-xl scrollbar-hide"
  >
    {QUICK_MESSAGE_REACTIONS.map((emoji) => {
      const isSelected = selectedEmoji === emoji;

      return (
        <button
          key={emoji}
          type="button"
          onClick={() => onSelect(emoji)}
          className={`flex h-8 w-8 items-center justify-center rounded-full text-lg transition-all duration-150 ${
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
