"use client";

import { useChatContext } from "@/context/ChatContext";
import FlyingEmoji from "./FlyingEmoji";

/**
 * ReactionsContainer - Renders flying emoji animations
 * Positioned to work in both normal and fullscreen modes
 */
const ReactionsContainer = () => {
  const { reactions } = useChatContext();

  return (
    <div className="absolute inset-0 pointer-events-none z-[9999] overflow-hidden">
      {reactions.map((reaction) => (
        <FlyingEmoji
          key={reaction.id}
          emoji={reaction.emoji}
          id={reaction.id}
        />
      ))}
    </div>
  );
};

export default ReactionsContainer;

