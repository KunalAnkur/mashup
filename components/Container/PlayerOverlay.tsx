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
import { ChatMessage } from "@/types/chatTypes";
import OverlayMessageBubble from "./OverlayMessageBubble";

const PlayerOverlay = () => {
  const dispatch = useDispatch();
  const panelCollapsed = useSelector(
    (state: RootState) => state.room.settings.panelCollapsed
  );
  const user = useSelector((state: RootState) => state.auth.user);

  // Get chat context
  const { messages, isJoined, sendMessage } = useChatContext();

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
  const [replyText, setReplyText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const mountedRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const hideInputTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Track timeouts for auto-dismissing messages after 60 seconds
  const messageTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Initialize: mark all existing messages as "seen" when component mounts
  useEffect(() => {
    if (!mountedRef.current && messages.length > 0) {
      const existingIds = new Set(messages.map((msg) => msg.id));
      setDisplayedMessageIds(existingIds);
      mountedRef.current = true;
    }
  }, [messages]);

  // Track new messages and add them to overlay (only if panel is closed)
  useEffect(() => {
    if (!isJoined || !mountedRef.current) return;

    const newMessages = messages.filter(
      (msg) =>
        msg.type !== "system" && // Don't show system messages
        !displayedMessageIds.has(msg.id) && // Only new messages
        !ignoredMessageIds.has(msg.id) && // Don't show messages that arrived when panel was open
        msg.userName !== user?.username && // Don't show own messages (compare by username)
        msg.userEmail !== user?.email // Also check email as fallback
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
          // Keep only last 5 messages to avoid clutter
          return combined.slice(-5);
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
    user?.username,
    user?.email,
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
      // Show input immediately when hovering message
      setIsAnyMessageHovered(true);
      if (inputRef.current) {
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    } else {
      // Delay hiding input to give user time to move cursor to input
      hideInputTimeoutRef.current = setTimeout(() => {
        // Only hide if input is not being hovered
        if (!isInputHovered) {
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
      setIsAnyMessageHovered(false);
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

      {/* Bottom Controls */}
      <div className="z-20 flex justify-end absolute bottom-0 left-0 w-full h-20 p-4">
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
        <div className="z-30 absolute bottom-24 right-4 pointer-events-none">
          <div className="pointer-events-auto max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
            <AnimatePresence mode="popLayout">
              {overlayMessages.map((message) => (
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
      )}

      {/* Single Reply Input at Bottom - Shows when any message is hovered OR input is hovered - Only show when panel is closed */}
      {panelCollapsed && (
        <AnimatePresence>
          {(isAnyMessageHovered || isInputHovered) &&
            overlayMessages.length > 0 && (
              <motion.form
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleSendReply}
                onMouseEnter={() => {
                  setIsInputHovered(true);
                  // Clear hide timeout when hovering input
                  if (hideInputTimeoutRef.current) {
                    clearTimeout(hideInputTimeoutRef.current);
                    hideInputTimeoutRef.current = null;
                  }
                }}
                onMouseLeave={() => {
                  setIsInputHovered(false);
                  // If no message is hovered, hide input after delay
                  if (!isAnyMessageHovered) {
                    hideInputTimeoutRef.current = setTimeout(() => {
                      setIsAnyMessageHovered(false);
                      hideInputTimeoutRef.current = null;
                    }, 300);
                  }
                }}
                className="z-30 absolute bottom-20 right-4 flex items-center gap-2 pointer-events-auto w-80"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a reply..."
                  className="flex-1 backdrop-blur-md bg-black/60 border border-white/20 rounded-full px-4 py-2.5 text-white text-sm placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500/50"
                  disabled={isSending}
                />
                <button
                  type="submit"
                  disabled={!replyText.trim() || isSending}
                  className="backdrop-blur-md bg-pink-500/80 hover:bg-pink-500 rounded-full p-2.5 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
