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
  align?: "left" | "right";
  selectedEmoji?: ReactionType | null;
  onSelect: (emoji: ReactionType) => void;
}

const MessageReactionPicker = ({
  align = "left",
  selectedEmoji = null,
  onSelect,
}: MessageReactionPickerProps) => (
  <div
    className={`absolute -top-12 z-30 flex items-center gap-1 rounded-full border border-white/10 bg-zinc-950/90 px-2 py-1.5 shadow-2xl backdrop-blur-xl ${
      align === "right" ? "right-0" : "left-0"
    }`}
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
