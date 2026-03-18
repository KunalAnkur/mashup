"use client";

import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { setPanelCollapsed } from "@/lib/store/slices/roomSlice";
import { useDispatch, useSelector } from "react-redux";
import { useChatContext } from "@/context/ChatContext";
import { FiChevronsLeft, FiX, FiChevronDown } from "react-icons/fi";
import { FiChevronsRight } from "react-icons/fi";
import { FaPaperPlane } from "react-icons/fa";
import { RootState } from "@/lib/store";
import { ChatMessage, ReactionType } from "@/types/chatTypes";
import OverlayMessageBubble from "./OverlayMessageBubble";
import AnimatedReaction from "../Panel/AnimatedReaction";
import { showError } from "@/utils/toast";
import { useTranslations } from "@/i18n/I18nProvider";
import { isMobile } from "react-device-detect";
import { Input } from "@/components/UI";
import {
  appInputRadiusClass,
  zincGlassBlurredSurfaceClass,
  zincGlassBorderedSurfaceClass,
} from "@/components/UI/classTokens";

declare global {
  interface Window {
    __currentUser?: RootState["auth"]["user"];
  }
}

const PlayerOverlay = () => {
  const dispatch = useDispatch();
  const panelCollapsed = useSelector(
    (state: RootState) => state.room.settings.panelCollapsed
  );
  const user = useSelector((state: RootState) => state.auth.user);

  // Get chat context
  const { messages, isJoined, sendMessage, sendReaction } = useChatContext();
  const tToast = useTranslations("toast");

  // Track displayed messages to avoid showing old messages
  const [displayedMessageIds, setDisplayedMessageIds] = useState<Set<string>>(
    new Set()
  );
  // Track messages that arrived when panel was open - these should never be shown
  const [ignoredMessageIds, setIgnoredMessageIds] = useState<Set<string>>(
    new Set()
  );
  const [overlayMessages, setOverlayMessages] = useState<ChatMessage[]>([]);
  const [isAnyMessageHovered, setIsAnyMessageHovered] = useState(false);
  const [isInputHovered, setIsInputHovered] = useState(false);
  const [isReactionsHovered, setIsReactionsHovered] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const mountedRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const hideInputTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Track timeouts for auto-dismissing messages after 60 seconds
  const messageTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Default reactions
  const DEFAULT_REACTIONS: ReactionType[] = [
    "😍",
    "😡",
    "😭",
    "😂",
    "🤯",
    "🔥",
  ];

  // Load pinned reactions from localStorage or use defaults
  const [pinnedReactions] = useState<ReactionType[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("pinnedReactions");
      return saved ? JSON.parse(saved) : DEFAULT_REACTIONS;
    }
    return DEFAULT_REACTIONS;
  });

  // Track which reaction was just clicked for animation
  const [animatingReaction, setAnimatingReaction] =
    useState<ReactionType | null>(null);

  // Initialize: mark all existing messages as "seen" when component mounts
  useEffect(() => {
    if (!mountedRef.current && messages.length > 0) {
      const existingIds = new Set(messages.map((msg) => msg.id));
      setDisplayedMessageIds(existingIds);
      mountedRef.current = true;
    }
    
    // Store current user info globally for OverlayMessageBubble to access
    if (typeof window !== "undefined") {
      window.__currentUser = user;
    }
  }, [messages, user]);

  // Clear overlay messages when panel opens
  useEffect(() => {
    if (!panelCollapsed) {
      // Panel is open - clear all overlay messages and their timeouts
      setOverlayMessages((prev) => {
        // Clear timeouts for all current messages
        prev.forEach((msg) => {
          const timeoutId = messageTimeoutsRef.current.get(msg.id);
          if (timeoutId) {
            clearTimeout(timeoutId);
            messageTimeoutsRef.current.delete(msg.id);
          }
        });
        return []; // Clear all messages
      });
      setIsAnyMessageHovered(false);
    }
  }, [panelCollapsed]);

  // Track new messages and add them to overlay (only if panel is closed)
  useEffect(() => {
    if (!isJoined || !mountedRef.current) return;

    const newMessages = messages.filter(
      (msg) =>
        msg.type !== "system" && // Don't show system messages
        !displayedMessageIds.has(msg.id) && // Only new messages
        !ignoredMessageIds.has(msg.id) // Don't show messages that arrived when panel was open
        // REMOVED: Don't filter out own messages anymore - we want to see our replies!
    );

    if (newMessages.length > 0) {
      // If panel is open, mark these messages as ignored (never show them)
      if (!panelCollapsed) {
        setIgnoredMessageIds((prev) => {
          const updated = new Set(prev);
          newMessages.forEach((msg) => updated.add(msg.id));
          return updated;
        });
        // Mark them as displayed so we don't process them again
        setDisplayedMessageIds((prev) => {
          const updated = new Set(prev);
          newMessages.forEach((msg) => updated.add(msg.id));
          return updated;
        });
      } else {
        // Panel is closed - add messages to overlay
        // Filter out any ignored messages to ensure they never appear
        setOverlayMessages((prev) => {
          const filtered = prev.filter((msg) => !ignoredMessageIds.has(msg.id));
          const combined = [...filtered, ...newMessages];
          // Keep only last 4 messages to avoid clutter and ensure all are visible
          return combined.slice(-4);
        });

        // Mark them as displayed
        setDisplayedMessageIds((prev) => {
          const updated = new Set(prev);
          newMessages.forEach((msg) => updated.add(msg.id));
          return updated;
        });

        // Set up 60-second auto-dismiss timer for each new message
        newMessages.forEach((msg) => {
          const messageTimestamp = msg.timestamp || Date.now();
          const timeSinceSent = Date.now() - messageTimestamp;
          const remainingTime = Math.max(0, 60000  - timeSinceSent); // 60 seconds = 60000ms

          if (remainingTime > 0) {
            const timeoutId = setTimeout(() => {
              setOverlayMessages((prev) => prev.filter((m) => m.id !== msg.id));
              messageTimeoutsRef.current.delete(msg.id);
            }, remainingTime);

            messageTimeoutsRef.current.set(msg.id, timeoutId);
          }
        });
      }
    }
  }, [
    messages,
    displayedMessageIds,
    ignoredMessageIds,
    isJoined,
    panelCollapsed,
  ]);

  const handleDismissMessage = (messageId: string) => {
    setOverlayMessages((prev) => prev.filter((msg) => msg.id !== messageId));
    // Clear the timeout if it exists
    const timeoutId = messageTimeoutsRef.current.get(messageId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      messageTimeoutsRef.current.delete(messageId);
    }
  };

  const handleClearAllMessages = () => {
    // Clear all timeouts
    messageTimeoutsRef.current.forEach((timeoutId) => {
      clearTimeout(timeoutId);
    });
    messageTimeoutsRef.current.clear();
    
    // Clear all overlay messages
    setOverlayMessages([]);
    setIsAnyMessageHovered(false);
  };

  const handleMessageHover = (hovered: boolean) => {
    // Clear any existing timeout
    if (hideInputTimeoutRef.current) {
      clearTimeout(hideInputTimeoutRef.current);
      hideInputTimeoutRef.current = null;
    }

    if (hovered) {
      // Show input and reactions immediately when hovering message
      setIsAnyMessageHovered(true);
      if (inputRef.current) {
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    } else {
      // Delay hiding input/reactions to give user time to move cursor
      hideInputTimeoutRef.current = setTimeout(() => {
        // Hide when message is no longer hovered (unless hovering input/reactions)
        if (!isInputHovered && !isReactionsHovered) {
          setIsAnyMessageHovered(false);
        }
        hideInputTimeoutRef.current = null;
      }, 300); // 300ms delay - gives user time to move cursor
    }
  };

  // Cleanup timeouts on unmount
  useEffect(() => {
    const timeoutsMap = messageTimeoutsRef.current;
    return () => {
      if (hideInputTimeoutRef.current) {
        clearTimeout(hideInputTimeoutRef.current);
      }
      // Clear all message auto-dismiss timeouts
      timeoutsMap.forEach((timeoutId) => {
        clearTimeout(timeoutId);
      });
      timeoutsMap.clear();
    };
  }, []);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || isSending) return;

    setIsSending(true);
    try {
      await sendMessage(replyText.trim());
      setReplyText("");
      // Keep input visible after sending so user can see their message appear
      // It will auto-hide after the hover timeout
    } catch (error) {
      console.error("Failed to send message:", error);
      showError(tToast("failedToSendMessage"), tToast("checkConnection"));
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendReply(e);
    }
  };

  const handleTogglePanelExpand = () => {
    const newPanelCollapsedState = !panelCollapsed;
    dispatch(setPanelCollapsed({ panelCollapsed: newPanelCollapsedState }));
  };

  const playerOverlayPanelToggleButtonClass =
    `flex items-center gap-1.5 md:gap-2 px-3 md:px-5 py-2 md:py-2.5 ${zincGlassBorderedSurfaceClass} hover:from-purple-600/20 hover:via-pink-600/20 hover:to-fuchsia-600/20 hover:border-purple-500/30 rounded-full transition-all font-medium text-white text-xs md:text-sm cursor-pointer`;
  const playerOverlayClearAllButtonClass =
    `flex items-center gap-1.5 px-3 py-1.5 ${zincGlassBlurredSurfaceClass} hover:from-red-600/20 hover:via-rose-600/20 hover:to-pink-600/20 hover:border-red-500/30 rounded-lg text-white/70 hover:text-white text-xs font-medium transition-all duration-200`;
  const playerOverlayRoundedGlassClass =
    `${zincGlassBlurredSurfaceClass} rounded-2xl`;
  const playerOverlaySendButtonClass =
    "absolute right-2 bg-gradient-to-r from-purple-600 via-pink-600 to-fuchsia-600 hover:from-purple-500 hover:via-pink-500 hover:to-fuchsia-500 rounded-lg p-2 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-purple-500/30 shadow-lg shadow-purple-500/20";


  return (
    <>
      {/* Top Controls */}
      <div className="z-20 flex justify-end absolute top-0 left-0 w-full h-16 md:h-20 p-3 md:p-4">
        <div className="flex gap-2 md:gap-3">
         
          <button
            className={playerOverlayPanelToggleButtonClass}
            onClick={handleTogglePanelExpand}
          >
            {isMobile ? (
              // On mobile: show up arrow when panel is collapsed (to open it), down arrow when open (to close it)
              panelCollapsed ? (
                <FiChevronDown size={18} className="md:w-5 md:h-5 rotate-180" />
              ) : (
                <FiChevronDown size={18} className="md:w-5 md:h-5" />
              )
            ) : (
              // On desktop: show left/right arrows
              panelCollapsed ? (
                <FiChevronsLeft size={20} />
              ) : (
                <FiChevronsRight size={20} />
              )
            )}
          </button>
        </div>
      </div>

      {/* Overlay Messages, Reactions, and Input Container - Only show when panel is closed */}
      {panelCollapsed && (
        <div className="  z-30 absolute bottom-16 right-4 flex flex-col items-end pointer-events-none">
          {/* Message Bubbles */}
          <div className="pointer-events-auto overflow-visible">
            <div className="flex flex-col">
              {/* Clear All Button - Only show when there are messages */}
              {overlayMessages.filter((msg) => !ignoredMessageIds.has(msg.id)).length > 0 && (
                <div className="flex justify-end mb-2">
                  <button
                    onClick={handleClearAllMessages}
                    className={playerOverlayClearAllButtonClass}
                    title="Clear all messages"
                  >
                    <FiX size={14} />
                    <span>Clear All</span>
                  </button>
                </div>
              )}
              <AnimatePresence mode="popLayout">
                {overlayMessages
                  .filter((msg) => !ignoredMessageIds.has(msg.id))
                  .slice(-4)
                  .map((message) => (
                    <OverlayMessageBubble
                      key={message.id}
                      message={message}
                      onDismiss={() => handleDismissMessage(message.id)}
                      onHover={handleMessageHover}
                    />
                  ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Reactions and Input - Shows when any message is hovered */}
<AnimatePresence>
  {isAnyMessageHovered && overlayMessages.length > 0 && (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      onMouseEnter={() => {
        setIsInputHovered(true);
        setIsReactionsHovered(true);
        // Keep input/reactions visible when hovering them
        setIsAnyMessageHovered(true);
        // Clear hide timeout when hovering
        if (hideInputTimeoutRef.current) {
          clearTimeout(hideInputTimeoutRef.current);
          hideInputTimeoutRef.current = null;
        }
      }}
      onMouseLeave={() => {
        setIsInputHovered(false);
        setIsReactionsHovered(false);
        // Hide after delay if no message is hovered
        hideInputTimeoutRef.current = setTimeout(() => {
          setIsAnyMessageHovered(false);
          hideInputTimeoutRef.current = null;
        }, 300);
      }}
      className="flex flex-col  pointer-events-auto w-[280px]"
    >
      {/* Reactions - Glassmorphism Container */}
      <div className={`${playerOverlayRoundedGlassClass} p-2 mb-2`}>
        <div className="flex items-center justify-center gap-2">
          {pinnedReactions.map((emoji) => (
            <AnimatedReaction
              key={emoji}
              emoji={emoji}
              isAnimating={animatingReaction === emoji}
              disabled={!isJoined}
              onClick={() => {
                setAnimatingReaction(emoji);
                sendReaction(emoji);
                // Reset animation after it completes
                setTimeout(() => {
                  setAnimatingReaction(null);
                }, 600);
              }}
            />
          ))}
        </div>
      </div>

      {/* Input with Send Button Inside - Glassmorphism Container */}
      <form
        onSubmit={handleSendReply}
        className={playerOverlayRoundedGlassClass}
      >
        <div className="relative flex items-center p-2">
          <Input
            variant="raw"
            ref={inputRef}
            type="text"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a reply..."
            className={`w-full bg-transparent ${appInputRadiusClass} pl-4 pr-12 py-1.5 text-white text-sm placeholder:text-white/40 transition-all outline-none`}
            disabled={isSending}
          />
          <button
            type="submit"
            disabled={!replyText.trim() || isSending}
            className={playerOverlaySendButtonClass}
          >
            <FaPaperPlane size={12} />
          </button>
        </div>
      </form>
    </motion.div>
  )}
</AnimatePresence>
        </div>
      )}
    </>
  );
};

export default PlayerOverlay;
