"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { ReactionType } from "@/types/chatTypes";

interface FlyingEmojiProps {
  emoji: string;
  id: string;
  onComplete?: () => void;
}

const FlyingEmoji = ({ emoji, id, onComplete }: FlyingEmojiProps) => {
  // Random starting position from left (10% to 90% of screen width)
  const [startPosition] = useState(() => 10 + Math.random() * 80);
  
  // Random horizontal movement during animation (-30px to +30px)
  const [horizontalDrift] = useState(() => Math.random() * 60 - 30);

  useEffect(() => {
    // Call onComplete after animation finishes
    const timer = setTimeout(() => {
      if (onComplete) onComplete();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  // Map our emojis to Microsoft Fluent Animated Emoji URLs
  const getAnimatedEmojiUrl = (emoji: string): string => {
    const baseUrl =
      "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Microsoft-Teams-Animated-Emojis/master/Emojis";

    switch (emoji as ReactionType) {
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

  // Get emoji-specific animation based on type
  const getEmojiAnimation = (emoji: string) => {
    switch (emoji as ReactionType) {
      case "😍": // Heart eyes - spin
        return {
          rotate: [0, 360, 720],
          scale: [0.5, 1.3, 1.1, 1.2, 0.9, 0.7],
        };
      
      case "😡": // Angry - shake while flying
        return {
          rotate: [0, -10, 10, -10, 10, -5, 5, 0],
          scale: [0.5, 1.3, 1.2, 1.1, 0.9, 0.7],
          x: [0, horizontalDrift - 10, horizontalDrift + 10, horizontalDrift - 5, horizontalDrift + 5, horizontalDrift],
        };
      
      case "😭": // Crying - bounce
        return {
          rotate: [0, -5, 5, -3, 3, 0],
          scale: [0.5, 1.4, 1.0, 1.3, 0.9, 0.7],
        };
      
      case "😂": // Laughing - wiggle
        return {
          rotate: [0, 15, -15, 10, -10, 5, -5, 0],
          scale: [0.5, 1.3, 1.1, 1.2, 0.9, 0.7],
        };
      
      case "🤯": // Mind blown - explosive spin
        return {
          rotate: [0, 180, 360, 540],
          scale: [0.5, 1.5, 1.0, 1.3, 0.8, 0.6],
        };
      
      case "🔥": // Fire - flicker
        return {
          rotate: [0, 5, -5, 3, -3, 0],
          scale: [0.5, 1.4, 1.2, 1.3, 1.0, 0.7],
          x: [0, horizontalDrift - 5, horizontalDrift + 5, horizontalDrift],
        };
      
      default:
        return {
          rotate: [0, 5, -5, 3, 0],
          scale: [0.5, 1.2, 1, 0.9, 0.7],
        };
    }
  };

  const emojiAnimation = getEmojiAnimation(emoji);
  const emojiUrl = getAnimatedEmojiUrl(emoji);

  return (
    <motion.div
      key={id}
      initial={{
        y: 0,
        x: 0,
        opacity: 0,
        scale: 0.5,
        rotate: 0,
      }}
      animate={{
        y: -window.innerHeight * 1.2, // Fly beyond the top of the screen
        x: emojiAnimation.x || horizontalDrift, // Emoji-specific or default drift
        opacity: [0, 1, 1, 0.8, 0],
        scale: emojiAnimation.scale,
        rotate: emojiAnimation.rotate,
      }}
      transition={{
        duration: 3,
        ease: "easeOut",
        times: [0, 0.1, 0.4, 0.7, 1],
      }}
      className="fixed pointer-events-none z-[9999]"
      style={{
        left: `${startPosition}%`,
        bottom: "0",
        filter: "drop-shadow(0 0 10px rgba(236,72,153,0.4))",
      }}
    >
      <img
        src={emojiUrl}
        alt={emoji}
        width={64}
        height={64}
        className="w-16 h-16"
        style={{ imageRendering: "auto" }}
      />
    </motion.div>
  );
};

export default FlyingEmoji;

