"use client";

import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { setPanelCollapsed } from "@/lib/store/slices/roomSlice";
import { useDispatch, useSelector } from "react-redux";
import { useChatContext } from "@/context/ChatContext";
import { BsFillChatSquareFill } from "react-icons/bs";
import { FiChevronsLeft } from "react-icons/fi";
import { FiChevronsRight } from "react-icons/fi";
import { FaPaperPlane } from "react-icons/fa";
import { RootState } from "@/lib/store";
import { ChatMessage, ReactionType } from "@/types/chatTypes";
import OverlayMessageBubble from "./OverlayMessageBubble";
import AnimatedReaction from "../Panel/AnimatedReaction";

const PlayerOverlay = () => {
  const dispatch = useDispatch();
  const panelCollapsed = useSelector(
    (state: RootState) => state.room.settings.panelCollapsed
  );
  const user = useSelector((state: RootState) => state.auth.user);

  // Get chat context
  const { messages, isJoined, sendMessage, sendReaction } = useChatContext();

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
    if (typeof window !== 'undefined') {
      (window as any).__currentUser = user;
    }
  }, [messages, user]);

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
        setOverlayMessages((prev) => {
          const combined = [...prev, ...newMessages];
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
          const remainingTime = Math.max(0, 60000 - timeSinceSent); // 60 seconds = 60000ms

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

  const handleToggleChat = () => {};

  return (
    <>
      {/* Top Controls */}
      <div className="z-20 flex justify-end absolute top-0 left-0 w-full h-20 p-4">
        <div className="flex gap-4">
          <span
            className="flex items-center backdrop-blur-sm gap-2 px-5 py-2.5 bg-gray-100/20 hover:bg-gray-100/40 rounded-full transition-all font-medium text-white text-sm cursor-pointer"
            onClick={handleToggleChat}
          >
            <BsFillChatSquareFill className="w-4 h-4" />
          </span>
          <span
            className="flex items-center backdrop-blur-sm gap-2 px-5 py-2.5 bg-gray-100/20 hover:bg-gray-100/40 rounded-full transition-all font-medium text-white text-sm cursor-pointer"
            onClick={handleTogglePanelExpand}
          >
            {panelCollapsed ? (
              <FiChevronsLeft size={20} />
            ) : (
              <FiChevronsRight size={20} />
            )}
          </span>
        </div>
      </div>

      

      {/* Overlay Message Bubbles - Bottom Right - Only show when panel is closed */}
      {panelCollapsed && (
        <div className="z-30 absolute bottom-44 right-4 pointer-events-none">
          <div className="pointer-events-auto overflow-visible">
            <div className="flex flex-col">
              <AnimatePresence mode="popLayout">
                {overlayMessages.slice(-4).map((message) => (
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
        </div>
      )}

      {/* Reactions - Shows above input when any message is hovered - Only show when panel is closed */}
      {panelCollapsed && (
        <AnimatePresence>
          {isAnyMessageHovered && overlayMessages.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                onMouseEnter={() => {
                  setIsReactionsHovered(true);
                  // Keep input/reactions visible when hovering them
                  setIsAnyMessageHovered(true);
                  // Clear hide timeout when hovering reactions
                  if (hideInputTimeoutRef.current) {
                    clearTimeout(hideInputTimeoutRef.current);
                    hideInputTimeoutRef.current = null;
                  }
                }}
                onMouseLeave={() => {
                  setIsReactionsHovered(false);
                  // Hide reactions after delay if no message is hovered
                  hideInputTimeoutRef.current = setTimeout(() => {
                    setIsAnyMessageHovered(false);
                    hideInputTimeoutRef.current = null;
                  }, 300);
                }}
                className="z-30 absolute bottom-32 right-4 flex items-center justify-center gap-2 pointer-events-auto backdrop-blur-xl bg-gradient-to-br from-black/80 via-black/70 to-black/60 border border-white/20 rounded-2xl px-3 py-1 "
              >
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
              </motion.div>
            )}
        </AnimatePresence>
      )}

      {/* Single Reply Input at Bottom - Shows when any message is hovered - Only show when panel is closed */}
      {panelCollapsed && (
        <AnimatePresence>
          {isAnyMessageHovered && overlayMessages.length > 0 && (
              <motion.form
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleSendReply}
                onMouseEnter={() => {
                  setIsInputHovered(true);
                  // Keep input/reactions visible when hovering them
                  setIsAnyMessageHovered(true);
                  // Clear hide timeout when hovering input
                  if (hideInputTimeoutRef.current) {
                    clearTimeout(hideInputTimeoutRef.current);
                    hideInputTimeoutRef.current = null;
                  }
                }}
                onMouseLeave={() => {
                  setIsInputHovered(false);
                  // Hide input after delay if no message is hovered
                  hideInputTimeoutRef.current = setTimeout(() => {
                    setIsAnyMessageHovered(false);
                    hideInputTimeoutRef.current = null;
                  }, 300);
                }}
                className="z-30 absolute bottom-16 right-4 flex items-center gap-2.5 pointer-events-auto w-[320px]"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a reply..."
                  className="flex-1 backdrop-blur-xl bg-black/80 border border-white/20 rounded-2xl px-4 py-3 text-white text-sm placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500/50 shadow-xl transition-all"
                  disabled={isSending}
                />
                <button
                  type="submit"
                  disabled={!replyText.trim() || isSending}
                  className="backdrop-blur-xl bg-gradient-to-br from-pink-500/90 to-rose-500/90 hover:from-pink-500 hover:to-rose-500 rounded-2xl p-3 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl border border-pink-400/30 flex-shrink-0"
                >
                  <FaPaperPlane size={14} />
                </button>
              </motion.form>
            )}
        </AnimatePresence>
      )}
    </>
  );
};

export default PlayerOverlay;