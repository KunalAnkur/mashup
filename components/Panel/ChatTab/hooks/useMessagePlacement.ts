import { useLayoutEffect, useCallback, RefObject } from "react";
import { ChatMessage } from "@/types/chatTypes";
import { MessageActionPlacement, MessageReactionPlacement } from "../types";
import {
  MESSAGE_REACTION_PICKER_APPROX_HEIGHT,
  MESSAGE_REACTION_PICKER_VERTICAL_OFFSET,
  MESSAGE_ACTIONS_MIN_SIDE_SPACE,
  MESSAGE_ACTIONS_WIDE_BUBBLE_RATIO,
} from "../constants";

export const useMessagePlacement = (
  messages: ChatMessage[],
  messageBubbleRefs: RefObject<Record<string, HTMLDivElement | null>>,
  messagesContainerRef: RefObject<HTMLDivElement>,
  setMessageActionPlacements: (placements: Record<string, MessageActionPlacement>) => void,
  setActiveReactionPlacement: (placement: MessageReactionPlacement) => void
) => {
  const resolveMessageOverlayPlacement = useCallback(
    (messageId: string, overlayHeight: number): MessageReactionPlacement => {
      const bubbleElement = messageBubbleRefs.current?.[messageId];
      const containerElement = messagesContainerRef.current;

      if (!bubbleElement || !containerElement) {
        return "top";
      }

      const bubbleRect = bubbleElement.getBoundingClientRect();
      const containerRect = containerElement.getBoundingClientRect();
      const requiredHeight = overlayHeight + MESSAGE_REACTION_PICKER_VERTICAL_OFFSET;
      const availableTop = bubbleRect.top - containerRect.top;
      const availableBottom = containerRect.bottom - bubbleRect.bottom;

      if (availableTop >= requiredHeight) {
        return "top";
      }

      if (availableBottom >= requiredHeight) {
        return "bottom";
      }

      return availableBottom > availableTop ? "bottom" : "top";
    },
    [messageBubbleRefs, messagesContainerRef]
  );

  const updateMessageReactionPlacement = useCallback(
    (messageId: string) => {
      setActiveReactionPlacement(
        resolveMessageOverlayPlacement(messageId, MESSAGE_REACTION_PICKER_APPROX_HEIGHT)
      );
    },
    [resolveMessageOverlayPlacement, setActiveReactionPlacement]
  );

  const resolveMessageActionPlacement = useCallback(
    (messageId: string): MessageActionPlacement => {
      const bubbleElement = messageBubbleRefs.current?.[messageId];
      const containerElement = messagesContainerRef.current;

      if (!bubbleElement || !containerElement) {
        return "side";
      }

      const bubbleRect = bubbleElement.getBoundingClientRect();
      const containerRect = containerElement.getBoundingClientRect();
      const availableRightSpace = containerRect.right - bubbleRect.right;
      const isWideBubble =
        bubbleRect.width >= containerRect.width * MESSAGE_ACTIONS_WIDE_BUBBLE_RATIO;

      if (isWideBubble || availableRightSpace < MESSAGE_ACTIONS_MIN_SIDE_SPACE) {
        return "top";
      }

      return "side";
    },
    [messageBubbleRefs, messagesContainerRef]
  );

  useLayoutEffect(() => {
    if (!messages.length) {
      setMessageActionPlacements({});
      return;
    }

    const updatePlacements = () => {
      const nextPlacements: Record<string, MessageActionPlacement> = {};

      messages.forEach((message) => {
        if (!message?.id) return;
        nextPlacements[message.id] = resolveMessageActionPlacement(message.id);
      });

      setMessageActionPlacements(nextPlacements);
    };

    const rafId = window.requestAnimationFrame(updatePlacements);
    window.addEventListener("resize", updatePlacements);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("resize", updatePlacements);
    };
  }, [messages, resolveMessageActionPlacement, setMessageActionPlacements]);

  return {
    updateMessageReactionPlacement,
    resolveMessageOverlayPlacement,
  };
};

// Made with Bob
