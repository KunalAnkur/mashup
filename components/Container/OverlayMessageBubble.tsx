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

  // Check if this is the current user's message
  const isOwnMessage = message.userName === (window as any).__currentUser?.username || 
                       message.userEmail === (window as any).__currentUser?.email;

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

  // Extract username from email for display
  const getDisplayUsername = () => {
    let displayUsername = message.userName || "Unknown User";
    if (message.userEmail) {
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
      className="relative mb-2.5 max-w-[280px] w-full"
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
    >
      {/* Message Bubble - Modern Design */}
      <div className={`relative backdrop-blur-xl rounded-2xl p-3 shadow-xl border transition-all duration-200 ${
        isOwnMessage 
          ? 'bg-gradient-to-br from-pink-500/30 via-rose-500/25 to-fuchsia-500/30 border-pink-400/30' 
          : 'bg-gradient-to-br from-black/80 via-black/70 to-black/60 border-white/20'
      }`}>
        {/* User Info - Compact Design */}
        <div className="flex items-center gap-2 mb-2.5">
          {message.userProfile ? (
            <img
              src={message.userProfile}
              alt={displayUsername}
              className="w-7 h-7 rounded-full object-cover ring-2 ring-white/20"
              onError={(e) => {
                e.currentTarget.style.display = "none";
                e.currentTarget.nextElementSibling?.classList.remove("hidden");
              }}
            />
          ) : null}
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-lg ring-2 ring-white/20 ${
              message.userProfile ? "hidden" : ""
            }`}
            style={{ backgroundColor: getUserColor(message.userName) }}
          >
            {getInitials(displayUsername)}
          </div>
          <span className="text-white/95 text-xs font-semibold truncate max-w-[180px]" title={displayUsername}>
            {displayUsername}
          </span>
        </div>

        {/* Message Text */}
        <p className="text-white/95 text-sm leading-relaxed whitespace-pre-wrap break-words">
          {message.message}
        </p>
      </div>
    </motion.div>
  );
};

export default OverlayMessageBubble;