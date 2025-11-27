"use client";

import { useState, useEffect } from "react";
import { ReactionType } from "@/types/chatTypes";
import { FaPlus, FaTimes, FaThumbtack } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

interface ReactionPickerProps {
  pinnedReactions: ReactionType[];
  onReactionsChange: (reactions: ReactionType[]) => void;
}

// All available Microsoft Fluent animated emojis for reactions (60 popular ones)
const ALL_REACTIONS: { emoji: ReactionType; name: string; category: string }[] = [
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

const ReactionPicker = ({ pinnedReactions, onReactionsChange }: ReactionPickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const categories = ["All", ...Array.from(new Set(ALL_REACTIONS.map(r => r.category)))];

  const filteredReactions = selectedCategory === "All" 
    ? ALL_REACTIONS 
    : ALL_REACTIONS.filter(r => r.category === selectedCategory);

  const togglePin = (emoji: ReactionType) => {
    if (pinnedReactions.includes(emoji)) {
      // Unpin
      onReactionsChange(pinnedReactions.filter(e => e !== emoji));
    } else {
      // Pin (max 6)
      if (pinnedReactions.length < 6) {
        onReactionsChange([...pinnedReactions, emoji]);
      }
    }
  };

  const isPinned = (emoji: ReactionType) => pinnedReactions.includes(emoji);

  return (
    <div className="relative">
      {/* Plus Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2 rounded-lg transition-all duration-200 ${
          isOpen
            ? "text-pink-400 bg-pink-500/10"
            : "text-gray-400 hover:text-pink-400 hover:bg-white/5"
        }`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        {isOpen ? <FaTimes size={20} /> : <FaPlus size={20} />}
      </motion.button>

      {/* Picker Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-full right-0 mb-2 w-72 bg-gradient-to-br from-[#1f1f23] to-[#27272a] rounded-xl shadow-2xl border border-white/10 overflow-hidden z-[200]"
          >
            {/* Header */}
            <div className="p-3 border-b border-white/10">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-white font-semibold text-xs">
                  Pin Reactions ({pinnedReactions.length}/6)
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <FaTimes size={14} />
                </button>
              </div>

              {/* Category Tabs */}
              <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-2 py-1 rounded-md text-[10px] font-medium whitespace-nowrap transition-all ${
                      selectedCategory === category
                        ? "bg-pink-500/20 text-pink-400"
                        : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* Emoji Grid */}
            <div className="p-2 max-h-56 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              <div className="grid grid-cols-6 gap-1.5">
                {filteredReactions.map((reaction) => {
                  const pinned = isPinned(reaction.emoji);
                  const canPin = pinnedReactions.length < 6 || pinned;

                  return (
                    <motion.button
                      key={reaction.emoji}
                      onClick={() => canPin && togglePin(reaction.emoji)}
                      disabled={!canPin}
                      className={`relative aspect-square rounded-md flex items-center justify-center text-xl transition-all ${
                        pinned
                          ? "bg-pink-500/20 ring-1 ring-pink-500/50"
                          : canPin
                          ? "bg-white/5 hover:bg-white/10"
                          : "bg-white/5 opacity-30 cursor-not-allowed"
                      }`}
                      whileHover={canPin ? { scale: 1.05 } : {}}
                      whileTap={canPin ? { scale: 0.95 } : {}}
                      title={reaction.name}
                    >
                      {reaction.emoji}
                      {pinned && (
                        <div className="absolute -top-0.5 -right-0.5 bg-pink-500 rounded-full p-0.5">
                          <FaThumbtack size={6} className="text-white" />
                        </div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="p-2 border-t border-white/10 bg-black/20">
              <p className="text-[10px] text-gray-400 text-center">
                Click to pin/unpin • Max 6
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ReactionPicker;

