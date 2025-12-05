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

  // Format timestamp to readable time (consistent with ChatTab)
  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, "0");
    return `${displayHours}:${displayMinutes} ${ampm}`;
  };

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
     {/* Message Bubble - Glassmorphism Design */}
<div className="relative backdrop-blur-md bg-black/05 rounded-2xl p-3  transition-all duration-200">
  {/* Username and Message */}
  <div>
    <span 
      className="text-sm  inline"
      style={{ color: getUserColor(message.userName) }}
      title={displayUsername}
    >
      {displayUsername}:{' '}
    </span>
    <span className="text-white/70 text-sm leading-relaxed whitespace-pre-wrap break-words">
      {message.message}
    </span>
  </div>
  {/* Timestamp */}
  <div className="flex justify-end">
    <span className="text-white/80 text-[10px] font-medium">
      {formatTime(message.timestamp || Date.now())}
    </span>
  </div>
</div>



    </motion.div>
  );
};

export default OverlayMessageBubble;