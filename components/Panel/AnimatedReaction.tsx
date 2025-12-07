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

  // Map our emojis to Microsoft Fluent Animated Emoji URLs (60 emojis)
  const getAnimatedEmojiUrl = (emoji: ReactionType): string | null => {
    const baseUrl =
      "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Microsoft-Teams-Animated-Emojis/master/Emojis";

    switch (emoji) {
      // Smilies (35)
      case "😍": return `${baseUrl}/Smilies/Smiling%20Face%20with%20Heart-Eyes.png`;
      case "😂": return `${baseUrl}/Smilies/Face%20with%20Tears%20of%20Joy.png`;
      case "😭": return `${baseUrl}/Smilies/Loudly%20Crying%20Face.png`;
      case "😡": return `${baseUrl}/Smilies/Enraged%20Face.png`;
      case "🤯": return `${baseUrl}/Smilies/Exploding%20Head.png`;
      case "😊": return `${baseUrl}/Smilies/Smiling%20Face%20with%20Smiling%20Eyes.png`;
      case "😢": return `${baseUrl}/Smilies/Crying%20Face.png`;
      case "😮": return `${baseUrl}/Smilies/Face%20with%20Open%20Mouth.png`;
      case "🤔": return `${baseUrl}/Smilies/Thinking%20Face.png`;
      case "😎": return `${baseUrl}/Smilies/Smiling%20Face%20with%20Sunglasses.png`;
      case "🥳": return `${baseUrl}/Smilies/Partying%20Face.png`;
      case "😴": return `${baseUrl}/Smilies/Sleeping%20Face.png`;
      case "🤗": return `${baseUrl}/Smilies/Hugging%20Face.png`;
      case "❤️": return `${baseUrl}/Smilies/Red%20Heart.png`;
      case "💔": return `${baseUrl}/Smilies/Broken%20Heart.png`;
      case "😘": return `${baseUrl}/Smilies/Face%20Blowing%20a%20Kiss.png`;
      case "🥰": return `${baseUrl}/Smilies/Smiling%20Face%20with%20Hearts.png`;
      case "😜": return `${baseUrl}/Smilies/Winking%20Face%20with%20Tongue.png`;
      case "😇": return `${baseUrl}/Smilies/Smiling%20Face%20with%20Halo.png`;
      case "🤩": return `${baseUrl}/Smilies/Star-Struck.png`;
      case "😱": return `${baseUrl}/Smilies/Face%20Screaming%20in%20Fear.png`;
      case "🥺": return `${baseUrl}/Smilies/Pleading%20Face.png`;
      case "😳": return `${baseUrl}/Smilies/Flushed%20Face.png`;
      case "🙄": return `${baseUrl}/Smilies/Face%20with%20Rolling%20Eyes.png`;
      case "😬": return `${baseUrl}/Smilies/Grimacing%20Face.png`;
      case "🤐": return `${baseUrl}/Smilies/Zipper-Mouth%20Face.png`;
      case "🤢": return `${baseUrl}/Smilies/Nauseated%20Face.png`;
      case "🤮": return `${baseUrl}/Smilies/Face%20Vomiting.png`;
      case "🤧": return `${baseUrl}/Smilies/Sneezing%20Face.png`;
      case "😷": return `${baseUrl}/Smilies/Face%20with%20Medical%20Mask.png`;
      case "🤒": return `${baseUrl}/Smilies/Face%20with%20Thermometer.png`;
      case "😈": return `${baseUrl}/Smilies/Smiling%20Face%20with%20Horns.png`;
      case "👻": return `${baseUrl}/Smilies/Ghost.png`;
      case "💀": return `${baseUrl}/Smilies/Skull.png`;
      case "🤡": return `${baseUrl}/Smilies/Clown%20Face.png`;
      
      // Hand gestures (15)
      case "👍": return `${baseUrl}/Hand%20gestures/Thumbs%20Up.png`;
      case "👎": return `${baseUrl}/Hand%20gestures/Thumbs%20Down.png`;
      case "👏": return `${baseUrl}/Hand%20gestures/Clapping%20Hands.png`;
      case "🙏": return `${baseUrl}/Hand%20gestures/Folded%20Hands.png`;
      case "💪": return `${baseUrl}/Hand%20gestures/Flexed%20Biceps.png`;
      case "✌️": return `${baseUrl}/Hand%20gestures/Victory%20Hand.png`;
      case "🤞": return `${baseUrl}/Hand%20gestures/Crossed%20Fingers.png`;
      case "🤟": return `${baseUrl}/Hand%20gestures/Love-You%20Gesture.png`;
      case "🤘": return `${baseUrl}/Hand%20gestures/Sign%20of%20the%20Horns.png`;
      case "👌": return `${baseUrl}/Hand%20gestures/OK%20Hand.png`;
      case "🤝": return `${baseUrl}/Hand%20gestures/Handshake.png`;
      case "✋": return `${baseUrl}/Hand%20gestures/Raised%20Hand.png`;
      case "👋": return `${baseUrl}/Hand%20gestures/Waving%20Hand.png`;
      case "🙌": return `${baseUrl}/Hand%20gestures/Raising%20Hands.png`;
      case "👊": return `${baseUrl}/Hand%20gestures/Oncoming%20Fist.png`;
      
      // Objects (10)
      case "🔥": return `${baseUrl}/Travel%20and%20places/Fire.png`;
      case "🎉": return `${baseUrl}/Activities/Party%20Popper.png`;
      case "💯": return `${baseUrl}/Smilies/Hundred%20Points.png`;
      case "⚡": return `${baseUrl}/Travel%20and%20places/High%20Voltage.png`;
      case "⭐": return `${baseUrl}/Travel%20and%20places/Star.png`;
      case "✨": return `${baseUrl}/Travel%20and%20places/Sparkles.png`;
      case "💥": return `${baseUrl}/Smilies/Collision.png`;
      case "💫": return `${baseUrl}/Travel%20and%20places/Dizzy.png`;
      case "🎊": return `${baseUrl}/Activities/Confetti%20Ball.png`;
      case "🎈": return `${baseUrl}/Activities/Balloon.png`;
      
      default:
        return null;
    }
  };

  // Simple scale animation for button interaction
  const variants = {
    idle: { scale: 1 },
    hover: { scale: 1.15 },
    flying: {
      scale: [1, 1.2, 1],
      transition: { duration: 0.4, ease: "easeInOut" },
    },
  };

  // Show animated emoji only when hovering or animating (flying)
  const shouldShowAnimated = isHovered || isAnimating;
  const animatedUrl = getAnimatedEmojiUrl(emoji);
  const hasAnimatedVersion = animatedUrl !== null;

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => !disabled && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:drop-shadow-[0_0_8px_rgba(236,72,153,0.5)] ${className}`}
      variants={variants}
      initial="idle"
      animate={isAnimating ? "flying" : "idle"}
      whileHover={!disabled && !isAnimating ? "hover" : undefined}
      title={`Send ${emoji} reaction`}
      style={{ width: "32px", height: "32px" }} // Fixed size to prevent jumping
    >
      {shouldShowAnimated && hasAnimatedVersion ? (
        // Animated emoji (on hover or when sending) - only if available
        <img
          key={`animated-${emoji}`}
          src={animatedUrl}
          alt={emoji}
          width={28}
          height={28}
          className="w-7 h-7"
          style={{ imageRendering: "auto" }}
        />
      ) : (
        // Static emoji (default state or no animated version)
        <span className="text-xl leading-none">{emoji}</span>
      )}
    </motion.button>
  );
};

export default AnimatedReaction;

