"use client";

import { useChatContext } from "@/context/ChatContext";
import FlyingEmoji from "./FlyingEmoji";

/**
 * ReactionsContainer - Renders flying emoji animations at the page level
 * This component should be placed at the room page level to ensure
 * emojis fly over the video player
 */
const ReactionsContainer = () => {
  const { reactions } = useChatContext();

  return (
    <>
      {reactions.map((reaction) => (
        <FlyingEmoji
          key={reaction.id}
          emoji={reaction.emoji}
          id={reaction.id}
        />
      ))}
    </>
  );
};

export default ReactionsContainer;

