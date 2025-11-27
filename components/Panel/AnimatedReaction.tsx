"use client";

import { motion } from "framer-motion";
import { ReactionType } from "@/types/chatTypes";
import { useState } from "react";

interface AnimatedReactionProps {
  emoji: ReactionType;
  isAnimating: boolean;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

/**
 * AnimatedReaction - Displays emoji that animates only on hover or when sending
 * Static by default, animated on hover/click
 */
const AnimatedReaction = ({
  emoji,
  isAnimating,
  onClick,
  disabled,
  className = "",
}: AnimatedReactionProps) => {
  const [isHovered, setIsHovered] = useState(false);

  // Map our emojis to Microsoft Fluent Animated Emoji URLs
  const getAnimatedEmojiUrl = (emoji: ReactionType): string => {
    const baseUrl =
      "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Microsoft-Teams-Animated-Emojis/master/Emojis";

    switch (emoji) {
      case "😍":
        return `${baseUrl}/Smilies/Smiling%20Face%20with%20Heart-Eyes.png`;
      case "😡":
        return `${baseUrl}/Smilies/Enraged%20Face.png`;
      case "😭":
        return `${baseUrl}/Smilies/Loudly%20Crying%20Face.png`;
      case "😂":
        return `${baseUrl}/Smilies/Face%20with%20Tears%20of%20Joy.png`;
      case "🤯":
        return `${baseUrl}/Smilies/Exploding%20Head.png`;
      case "🔥":
        return `${baseUrl}/Travel%20and%20places/Fire.png`;
      default:
        return "";
    }
  };

  // Simple scale animation for button interaction
  const variants = {
    idle: { scale: 1 },
    hover: { scale: 1.2 },
    flying: {
      scale: [1, 1.3, 1],
      transition: { duration: 0.4, ease: "easeInOut" },
    },
  };

  // Show animated emoji only when hovering or animating (flying)
  const shouldShowAnimated = isHovered || isAnimating;

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:drop-shadow-[0_0_8px_rgba(236,72,153,0.5)] ${className}`}
      variants={variants}
      initial="idle"
      animate={isAnimating ? "flying" : "idle"}
      whileHover={!disabled && !isAnimating ? "hover" : undefined}
      title={`Send ${emoji} reaction`}
    >
      {shouldShowAnimated ? (
        // Animated emoji (on hover or when sending)
        <img
          src={getAnimatedEmojiUrl(emoji)}
          alt={emoji}
          width={32}
          height={32}
          className="w-8 h-8"
          style={{ imageRendering: "auto" }}
        />
      ) : (
        // Static emoji (default state)
        <span className="text-2xl">{emoji}</span>
      )}
    </motion.button>
  );
};

export default AnimatedReaction;

