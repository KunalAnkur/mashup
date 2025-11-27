"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

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
        x: horizontalDrift, // Slight horizontal drift during flight
        opacity: [0, 1, 1, 0.8, 0],
        scale: [0.5, 1.2, 1, 0.9, 0.7],
        rotate: [0, 5, -5, 3, 0], // Slight rotation for more natural movement
      }}
      transition={{
        duration: 3,
        ease: "easeOut",
        times: [0, 0.1, 0.5, 0.8, 1],
      }}
      className="fixed pointer-events-none z-[9999]"
      style={{
        left: `${startPosition}%`,
        bottom: "0",
        fontSize: "48px",
        textShadow: "0 2px 8px rgba(0,0,0,0.3)",
      }}
    >
      {emoji}
    </motion.div>
  );
};

export default FlyingEmoji;

