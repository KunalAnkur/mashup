"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import { ChatMessage } from "@/types/chatTypes";
import { formatChatTime } from "@/utils/timeFormatter";

const overlayMessageBubbleSurfaceClass =
  "relative rounded-2xl bg-gradient-to-br from-purple-600/15 via-pink-600/10 to-fuchsia-600/10 p-3 backdrop-blur-xl transition-all duration-200";
const overlayMessageBubbleContentRowClass = "flex justify-end mt-1.5";
const overlayMessageBubbleTextClass =
  "text-sm leading-relaxed text-white/90 whitespace-pre-wrap break-words";
const overlayMessageBubbleTimestampClass =
  "text-[10px] font-medium text-white/50";

interface OverlayMessageBubbleProps {
  message: ChatMessage;
  onDismiss: () => void;
  onHover: (hovered: boolean) => void;
}

const OverlayMessageBubble = ({ message, onDismiss, onHover }: OverlayMessageBubbleProps) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const user = useSelector((state: RootState) => state.auth.user);

  // Check if this is the current user's message
  const isOwnMessage = user && (
    (user.email && message.userEmail && user.email.toLowerCase() === message.userEmail.toLowerCase()) ||
    ((user.username || user.name) && message.userName && 
     (user.username || user.name || "").toLowerCase() === message.userName.toLowerCase())
  );

  // Auto-dismiss after 60 seconds from when the message was SENT (not when it appears)
  useEffect(() => {
    const now = Date.now();
    const messageAge = now - message.timestamp; // How long ago the message was sent
    const remainingTime = Math.max(0, 60000 - messageAge); // 60 seconds minus age

    // If message is already older than 60 seconds, dismiss immediately
    if (remainingTime <= 0) {
      onDismiss();
      return;
    }

    // Set timeout for the remaining time
    timeoutRef.current = setTimeout(() => {
      onDismiss();
    }, remainingTime);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [message.timestamp, onDismiss]);

  // Get user color for avatar
  const getUserColor = (username: string) => {
    if (!username) return "#6366f1";
    const colors = [
      "#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16",
      "#22c55e", "#10b981", "#14b8a6", "#06b6d4", "#0ea5e9",
      "#3b82f6", "#6366f1", "#8b5cf6", "#a855f7", "#d946ef",
      "#ec4899", "#f43f5e"
    ];
    const hash = username.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  // Don't show system messages
  if (message.type === "system") {
    return null;
  }

  // Extract username for display
  // Always use message.userName first (which gets updated by useChat when USERNAME_UPDATED is received)
  // For current user's messages, also check Redux for the latest username
  const getDisplayUsername = () => {
    // Always start with message.userName (which is updated by useChat when USERNAME_UPDATED is received)
    let displayUsername = message.userName || "Unknown User";
    
    // For current user's messages, use current username from Redux (most up-to-date)
    if (isOwnMessage && user) {
      const currentUsername = user.username || user.name || "";
      if (currentUsername) {
        displayUsername = currentUsername;
      }
    }
    
    // Only fall back to email extraction if userName is missing or "Unknown User"
    if ((!displayUsername || displayUsername === "Unknown User") && message.userEmail) {
      const emailUsername = message.userEmail.split("@")[0];
      if (emailUsername) {
        displayUsername = emailUsername;
      }
    }
    
    return displayUsername;
  };

  const displayUsername = getDisplayUsername();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -5, scale: 0.95 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="relative mb-2.5 w-[280px]"
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
    >
      <div className={overlayMessageBubbleSurfaceClass}>
        <div>
          <span
            className="inline text-sm font-semibold"
            style={{ color: getUserColor(displayUsername) }}
            title={displayUsername}
          >
            {displayUsername}:{" "}
          </span>
          <span className={overlayMessageBubbleTextClass}>
            {message.message}
          </span>
        </div>
        <div className={overlayMessageBubbleContentRowClass}>
          <span className={overlayMessageBubbleTimestampClass}>
            {formatChatTime(message.timestamp || Date.now())}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default OverlayMessageBubble;
