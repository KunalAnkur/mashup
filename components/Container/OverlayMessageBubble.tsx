"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ChatMessage } from "@/types/chatTypes";

interface OverlayMessageBubbleProps {
  message: ChatMessage;
  onDismiss: () => void;
  onHover: (hovered: boolean) => void;
}

const OverlayMessageBubble = ({ message, onDismiss, onHover }: OverlayMessageBubbleProps) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

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


  // Get user initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.9 }}
      transition={{ duration: 0.3 }}
      className="relative mb-3 max-w-xs"
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
    >
      {/* Message Bubble */}
      <div className="backdrop-blur-md bg-black/60 rounded-2xl p-3 shadow-lg border border-white/10">
        {/* User Info */}
        <div className="flex items-center gap-2 mb-2">
          {message.userProfile ? (
            <img
              src={message.userProfile}
              alt={message.userName}
              className="w-6 h-6 rounded-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = "none";
                e.currentTarget.nextElementSibling?.classList.remove("hidden");
              }}
            />
          ) : null}
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold text-white ${
              message.userProfile ? "hidden" : ""
            }`}
            style={{ backgroundColor: getUserColor(message.userName) }}
          >
            {getInitials(message.userName)}
          </div>
          <span className="text-white text-xs font-medium truncate">
            {message.userName}
          </span>
        </div>

        {/* Message Text */}
        <p className="text-white/90 text-sm whitespace-pre-wrap break-words">
          {message.message}
        </p>
      </div>
    </motion.div>
  );
};

export default OverlayMessageBubble;

