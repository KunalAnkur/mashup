"use client";

import { motion } from "framer-motion";
import { useEffect, useState, useRef } from "react";
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
  
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Call onComplete after animation finishes
    const timer = setTimeout(() => {
      if (onComplete) onComplete();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  // Map our emojis to Microsoft Fluent Animated Emoji URLs (60 emojis)
  const getAnimatedEmojiUrl = (emoji: string): string | null => {
    const baseUrl =
      "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Microsoft-Teams-Animated-Emojis/master/Emojis";

    switch (emoji as ReactionType) {
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
  const hasAnimatedVersion = emojiUrl !== null;

  // Get container height - works in both normal and fullscreen mode
  const [containerHeight, setContainerHeight] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerHeight;
    }
    return 1000; // fallback
  });

  useEffect(() => {
    const updateHeight = () => {
      // In fullscreen, use the fullscreen element's dimensions
      const fullscreenElement = document.fullscreenElement;
      if (fullscreenElement) {
        setContainerHeight(fullscreenElement.clientHeight);
      } else {
        setContainerHeight(window.innerHeight);
      }
    };

    updateHeight();
    window.addEventListener("resize", updateHeight);
    document.addEventListener("fullscreenchange", updateHeight);
    document.addEventListener("webkitfullscreenchange", updateHeight);
    document.addEventListener("mozfullscreenchange", updateHeight);
    document.addEventListener("MSFullscreenChange", updateHeight);

    return () => {
      window.removeEventListener("resize", updateHeight);
      document.removeEventListener("fullscreenchange", updateHeight);
      document.removeEventListener("webkitfullscreenchange", updateHeight);
      document.removeEventListener("mozfullscreenchange", updateHeight);
      document.removeEventListener("MSFullscreenChange", updateHeight);
    };
  }, []);

  return (
    <motion.div
      ref={containerRef}
      key={id}
      initial={{
        y: 0,
        x: 0,
        opacity: 0,
        scale: 0.5,
        rotate: 0,
      }}
      animate={{
        y: -containerHeight * 1.2, // Fly beyond the top of the container
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
      {hasAnimatedVersion ? (
        // Use animated PNG if available
        <img
          src={emojiUrl}
          alt={emoji}
          width={64}
          height={64}
          className="w-16 h-16"
          style={{ imageRendering: "auto" }}
        />
      ) : (
        // Fallback to text emoji if no animated version
        <span className="text-6xl">{emoji}</span>
      )}
    </motion.div>
  );
};

export default FlyingEmoji;

