"use client";

import {
  appIconTextHoverClass,
  appMutedHoverSurfaceClass,
  appWhiteBorderClass,
} from "@/components/UI/classTokens";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useDropdownDismiss } from "@/components/UI/useDropdownDismiss";
import { ReactionType } from "@/types/chatTypes";
import { LuPin, LuPlus, LuX } from "react-icons/lu";
import { motion, AnimatePresence } from "framer-motion";

interface ReactionPickerProps {
  pinnedReactions: ReactionType[];
  onReactionsChange: (reactions: ReactionType[]) => void;
}

const reactionPickerTriggerButtonClass =
  "relative flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200";
/**
 * Rendered through a portal to <body>, so `fixed` here really is viewport-fixed and the
 * z-index competes at the top level. Left in the panel it did neither: the tab strip is an
 * Embla carousel, whose transformed track becomes the containing block for anything fixed
 * inside it, and the panel's own `overflow-hidden` then clipped the popover — which is why
 * it disappeared behind the call tiles instead of covering them. Placement comes from the
 * trigger's rect (see updateAnchor) rather than a hardcoded offset.
 *
 * z-[1200] sits above the panel and the floating call overlay, below Modal's 9999.
 */
const reactionPickerSurfaceClass =
  `fixed z-[1200] overflow-hidden rounded-2xl ${appWhiteBorderClass} bg-[#1f1f23] shadow-2xl reaction-picker-container`;
const reactionPickerHeaderFooterClass =
  "border-white/10 bg-gradient-to-br from-[#1f1f23] to-[#27272a]";
const reactionPickerCategoryButtonClass =
  "rounded-lg px-2.5 py-1 text-[10px] font-medium whitespace-nowrap transition-all";
const reactionPickerEmojiButtonClass =
  "relative flex aspect-square items-center justify-center rounded-lg text-xl transition-all";

// All available Microsoft Fluent animated emojis for reactions (60 popular ones)
const ALL_REACTIONS: { emoji: ReactionType; name: string; category: string }[] =
  [
    // Smilies (35 emojis)
    { emoji: "😍", name: "Heart Eyes", category: "Smilies" },
    { emoji: "😂", name: "Laughing", category: "Smilies" },
    { emoji: "😭", name: "Crying", category: "Smilies" },
    { emoji: "😡", name: "Angry", category: "Smilies" },
    { emoji: "🤯", name: "Mind Blown", category: "Smilies" },
    { emoji: "😊", name: "Smiling", category: "Smilies" },
    { emoji: "😢", name: "Sad", category: "Smilies" },
    { emoji: "😮", name: "Surprised", category: "Smilies" },
    { emoji: "🤔", name: "Thinking", category: "Smilies" },
    { emoji: "😎", name: "Cool", category: "Smilies" },
    { emoji: "🥳", name: "Celebrating", category: "Smilies" },
    { emoji: "😴", name: "Sleeping", category: "Smilies" },
    { emoji: "🤗", name: "Hugging", category: "Smilies" },
    { emoji: "❤️", name: "Red Heart", category: "Smilies" },
    { emoji: "💔", name: "Broken Heart", category: "Smilies" },
    { emoji: "😘", name: "Kissing", category: "Smilies" },
    { emoji: "🥰", name: "Love", category: "Smilies" },
    { emoji: "😜", name: "Winking Tongue", category: "Smilies" },
    { emoji: "😇", name: "Angel", category: "Smilies" },
    { emoji: "🤩", name: "Star Eyes", category: "Smilies" },
    { emoji: "😱", name: "Screaming", category: "Smilies" },
    { emoji: "🥺", name: "Pleading", category: "Smilies" },
    { emoji: "😳", name: "Flushed", category: "Smilies" },
    { emoji: "🙄", name: "Eye Roll", category: "Smilies" },
    { emoji: "😬", name: "Grimacing", category: "Smilies" },
    { emoji: "🤐", name: "Zipper Mouth", category: "Smilies" },
    { emoji: "🤢", name: "Nauseated", category: "Smilies" },
    { emoji: "🤮", name: "Vomiting", category: "Smilies" },
    { emoji: "🤧", name: "Sneezing", category: "Smilies" },
    { emoji: "😷", name: "Mask", category: "Smilies" },
    { emoji: "🤒", name: "Sick", category: "Smilies" },
    { emoji: "😈", name: "Devil", category: "Smilies" },
    { emoji: "👻", name: "Ghost", category: "Smilies" },
    { emoji: "💀", name: "Skull", category: "Smilies" },
    { emoji: "🤡", name: "Clown", category: "Smilies" },

    // Hand gestures (15 emojis)
    { emoji: "👍", name: "Thumbs Up", category: "Hand gestures" },
    { emoji: "👎", name: "Thumbs Down", category: "Hand gestures" },
    { emoji: "👏", name: "Clapping", category: "Hand gestures" },
    { emoji: "🙏", name: "Praying", category: "Hand gestures" },
    { emoji: "💪", name: "Strong", category: "Hand gestures" },
    { emoji: "✌️", name: "Peace", category: "Hand gestures" },
    { emoji: "🤞", name: "Crossed Fingers", category: "Hand gestures" },
    { emoji: "🤟", name: "Love You", category: "Hand gestures" },
    { emoji: "🤘", name: "Rock On", category: "Hand gestures" },
    { emoji: "👌", name: "OK", category: "Hand gestures" },
    { emoji: "🤝", name: "Handshake", category: "Hand gestures" },
    { emoji: "✋", name: "Raised Hand", category: "Hand gestures" },
    { emoji: "👋", name: "Wave", category: "Hand gestures" },
    { emoji: "🙌", name: "Raising Hands", category: "Hand gestures" },
    { emoji: "👊", name: "Fist Bump", category: "Hand gestures" },

    // Objects (10 emojis)
    { emoji: "🔥", name: "Fire", category: "Objects" },
    { emoji: "🎉", name: "Party", category: "Objects" },
    { emoji: "💯", name: "Hundred", category: "Objects" },
    { emoji: "⚡", name: "Lightning", category: "Objects" },
    { emoji: "⭐", name: "Star", category: "Objects" },
    { emoji: "✨", name: "Sparkles", category: "Objects" },
    { emoji: "💥", name: "Boom", category: "Objects" },
    { emoji: "💫", name: "Dizzy", category: "Objects" },
    { emoji: "🎊", name: "Confetti", category: "Objects" },
    { emoji: "🎈", name: "Balloon", category: "Objects" },
  ];

const ReactionPicker = ({
  pinnedReactions,
  onReactionsChange,
}: ReactionPickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [isMounted, setIsMounted] = useState(false);
  const [anchor, setAnchor] = useState<{ bottom: number; right: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  /** Sit the popover just above the trigger and aligned to its right edge, clamped to the viewport. */
  const updateAnchor = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const next = {
      bottom: Math.max(12, window.innerHeight - rect.top + 10),
      right: Math.max(12, window.innerWidth - rect.right - 4),
    };

    // Scroll fires far more often than the trigger actually moves — keep the same object when
    // nothing changed so a scrolling chat doesn't re-render the whole grid.
    setAnchor((prev) =>
      prev && prev.bottom === next.bottom && prev.right === next.right ? prev : next
    );
  }, []);

  // Before paint, so the popover never shows up at a stale position for a frame.
  useLayoutEffect(() => {
    if (!isOpen) return;
    updateAnchor();
  }, [isOpen, updateAnchor]);

  // The trigger moves with the chat — a new message, the reaction bar collapsing, a rotation.
  // Capture phase because the scroll happens on the panel's inner containers, not on window.
  useEffect(() => {
    if (!isOpen) return;

    window.addEventListener("resize", updateAnchor);
    window.addEventListener("scroll", updateAnchor, true);

    return () => {
      window.removeEventListener("resize", updateAnchor);
      window.removeEventListener("scroll", updateAnchor, true);
    };
  }, [isOpen, updateAnchor]);

  const closePicker = useCallback(() => setIsOpen(false), []);

  // Out of the panel's DOM subtree now, so a click anywhere else has to close it explicitly.
  useDropdownDismiss({
    isOpen,
    onClose: closePicker,
    refs: [triggerRef, panelRef],
  });

  const categories = [
    "All",
    ...Array.from(new Set(ALL_REACTIONS.map((r) => r.category))),
  ];

  const filteredReactions =
    selectedCategory === "All"
      ? ALL_REACTIONS
      : ALL_REACTIONS.filter((r) => r.category === selectedCategory);

  const togglePin = (emoji: ReactionType) => {
    if (pinnedReactions.includes(emoji)) {
      // Unpin
      onReactionsChange(pinnedReactions.filter((e) => e !== emoji));
    } else {
      // Pin (max 6)
      if (pinnedReactions.length < 6) {
        onReactionsChange([...pinnedReactions, emoji]);
      }
    }
  };

  const isPinned = (emoji: ReactionType) => pinnedReactions.includes(emoji);

  return (
    <>
      {/* Plus Button - Minimal Design */}
      <motion.button
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`${reactionPickerTriggerButtonClass} ${
          isOpen
            ? "text-pink-400 bg-pink-500/10"
            : "text-gray-400 hover:text-pink-400 hover:bg-white/5"
        }`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        title="Add more reactions"
      >
        {isOpen ? <LuX size={16} /> : <LuPlus size={16} />}
      </motion.button>

      {/* Picker Modal */}
      {isMounted &&
        createPortal(
          <AnimatePresence>
            {isOpen && anchor && (
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={reactionPickerSurfaceClass}
            style={{
              minWidth: "280px",
              maxWidth: "calc(100vw - 24px)",
              bottom: anchor.bottom,
              right: anchor.right,
            }}
          >
            {/* Header */}
            <div className={`border-b px-3 py-2.5 ${reactionPickerHeaderFooterClass}`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-white font-semibold text-xs">
                  Pin Reactions ({pinnedReactions.length}/6)
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className={`${appIconTextHoverClass} p-1 hover:bg-white/10 rounded`}
                >
                  <LuX size={12} />
                </button>
              </div>

              {/* Category Tabs */}
              <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`${reactionPickerCategoryButtonClass} ${
                      selectedCategory === category
                        ? "bg-pink-500/20 text-pink-400"
                        : `${appMutedHoverSurfaceClass} text-gray-400`
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* Emoji Grid */}
            <div className="p-2.5 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              <div className="grid grid-cols-6 gap-2">
                {filteredReactions.map((reaction) => {
                  const pinned = isPinned(reaction.emoji);
                  const canPin = pinnedReactions.length < 6 || pinned;

                  return (
                    <motion.button
                      key={reaction.emoji}
                      onClick={() => canPin && togglePin(reaction.emoji)}
                      disabled={!canPin}
                      className={`${reactionPickerEmojiButtonClass} ${
                        pinned
                          ? "bg-gradient-to-br from-pink-500/20 to-pink-600/20 ring-2 ring-pink-500/50"
                          : canPin
                          ? "bg-white/5 hover:bg-white/10"
                          : "bg-white/5 opacity-30 cursor-not-allowed"
                      }`}
                      whileHover={canPin ? { scale: 1.08 } : {}}
                      whileTap={canPin ? { scale: 0.92 } : {}}
                      title={reaction.name}
                    >
                      {reaction.emoji}
                      {pinned && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -top-1 -right-1 bg-gradient-to-br from-pink-500 to-pink-600 rounded-full p-1 shadow-lg"
                        >
                          <LuPin size={6} className="text-white" />
                        </motion.div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className={`border-t px-3 py-2 ${reactionPickerHeaderFooterClass}`}>
              <p className="text-[10px] text-gray-400 text-center">
                Click to pin/unpin • Max 6 reactions
              </p>
            </div>
          </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}

      {/* Responsive Styles */}
      <style jsx global>{`
        /* Responsive reaction picker styles */
        /* Small screens (sm: 640px) */
        @media (max-width: 639px) {
          .reaction-picker-container {
            min-width: 260px !important;
            max-height: 400px;
          }
          .reaction-picker-container .grid {
            grid-template-columns: repeat(5, minmax(0, 1fr)) !important;
            gap: 0.375rem !important;
          }
        }

        /* Medium screens (md: 768px) */
        @media (min-width: 640px) and (max-width: 767px) {
          .reaction-picker-container {
            min-width: 280px !important;
          }
        }

        /* Large screens (lg: 1024px) */
        @media (min-width: 768px) and (max-width: 1023px) {
          .reaction-picker-container {
            min-width: 300px !important;
          }
        }

        /* Extra large screens (xl: 1280px) */
        @media (min-width: 1024px) and (max-width: 1535px) {
          .reaction-picker-container {
            min-width: 320px !important;
          }
        }

        /* 2xl screens and above (1536px+) */
        @media (min-width: 1536px) {
          .reaction-picker-container {
            min-width: 340px !important;
          }
        }
      `}</style>
    </>
  );
};

export default ReactionPicker;
