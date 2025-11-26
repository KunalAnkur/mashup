"use client";

import { useState, useRef, useEffect } from "react";
import {
  FaSmile,
  FaSadTear,
  FaLaughSquint,
  FaSurprise,
  FaHeart,
  FaGrinHearts,
  FaArrowCircleUp,
} from "react-icons/fa";
import { useChat } from "@/hooks/useChat";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import { ChatMessage } from "@/types/chatTypes";

// Generate consistent color for a username
const getUserColor = (username: string | undefined | null) => {
  // Default color if username is not provided
  const defaultColor = {
    gradient: "from-rose-400 via-pink-400 to-fuchsia-400",
    bg: "from-rose-500 via-pink-500 to-fuchsia-500",
  };

  if (!username || typeof username !== "string" || username.length === 0) {
    return defaultColor;
  }

  const colors = [
    {
      gradient: "from-rose-400 via-pink-400 to-fuchsia-400",
      bg: "from-rose-500 via-pink-500 to-fuchsia-500",
    },
    {
      gradient: "from-blue-400 via-cyan-400 to-teal-400",
      bg: "from-blue-500 via-cyan-500 to-teal-500",
    },
    {
      gradient: "from-purple-400 via-indigo-400 to-blue-400",
      bg: "from-purple-500 via-indigo-500 to-blue-500",
    },
    {
      gradient: "from-emerald-400 via-green-400 to-teal-400",
      bg: "from-emerald-500 via-green-500 to-teal-500",
    },
    {
      gradient: "from-orange-400 via-amber-400 to-yellow-400",
      bg: "from-orange-500 via-amber-500 to-yellow-500",
    },
    {
      gradient: "from-violet-400 via-purple-400 to-fuchsia-400",
      bg: "from-violet-500 via-purple-500 to-fuchsia-500",
    },
    {
      gradient: "from-cyan-400 via-blue-400 to-indigo-400",
      bg: "from-cyan-500 via-blue-500 to-indigo-500",
    },
    {
      gradient: "from-pink-400 via-rose-400 to-red-400",
      bg: "from-pink-500 via-rose-500 to-red-500",
    },
  ];

  // Simple hash function to get consistent color for same username
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

// Format timestamp to readable time
const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  const displayMinutes = minutes.toString().padStart(2, "0");
  return `${displayHours}:${displayMinutes} ${ampm}`;
};

const ChatTab = () => {
  const [showEmojis, setShowEmojis] = useState(false);
  const [messageInput, setMessageInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Get room and user info from Redux
  const roomId = useSelector((state: RootState) => state.room.roomId);
  const isHost = useSelector((state: RootState) => state.room.host);
  const user = useSelector((state: RootState) => state.auth.user);

  // Use chat hook
  const {
    messages,
    typingUsers,
    sendMessage,
    handleTyping,
    stopTyping,
    isJoined,
    isLoading,
    isConnected,
  } = useChat({ roomId, isHost });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle sending message
  const handleSendMessage = async () => {
    if (!messageInput.trim() || !isJoined) return;

    const result = await sendMessage(messageInput);
    if (result.success) {
      setMessageInput("");
      stopTyping();
    } else {
      console.error("Failed to send message:", result.error);
    }
  };

  // Handle Enter key press
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Handle input change with typing indicator
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInput(e.target.value);
    if (e.target.value.trim()) {
      handleTyping();
    } else {
      stopTyping();
    }
  };

  // Check if message is from current user
  const isCurrentUserMessage = (message: ChatMessage) => {
    // We'll compare by socket ID or user name
    // For now, we'll use the user's name from Redux
    return user && message.userName === user.name;
  };

  return (
    <div className="flex flex-col h-full w-full gap-3">
      {/* Connection Status (for debugging) */}
      {!isConnected && (
        <div className="px-3 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
          <p className="text-yellow-400 text-xs">Connecting to chat...</p>
        </div>
      )}

      {isLoading && (
        <div className="px-3 py-2 bg-blue-500/10 border border-blue-500/30 rounded-xl">
          <p className="text-blue-400 text-xs">Joining chat room...</p>
        </div>
      )}

      {/* Chat Messages Area */}
      <div className="flex-1 flex flex-col gap-2 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {messages.length === 0 && isJoined && !isLoading && (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 text-sm">
              No messages yet. Start the conversation!
            </p>
          </div>
        )}

        {messages.map((msg, i) => {
          // Safety check: ensure message has required fields
          if (!msg || !msg.message) {
            return null;
          }

          const userName = msg.userName || "Unknown User";
          const isCurrentUser = isCurrentUserMessage(msg);
          const userColor = getUserColor(userName);
          const isSystemMessage = msg.type === "system";

          // System messages (user joined/left)
          if (isSystemMessage) {
            // Extract just the name from the message (remove " joined the chat" or " left the chat" part)
            // If userName is available and not "Unknown User", use it; otherwise extract from message
            let displayName = userName;
            if (!displayName || displayName === "Unknown User") {
              displayName = msg.message
                .replace(" joined the chat", "")
                .replace(" left the chat", "")
                .trim();
            }
            // Remove "Unknown User" prefix if it exists
            displayName = displayName.replace(/^Unknown User\s+/i, "");

            return (
              <div key={msg.id || i} className="flex justify-center py-2">
                <div className="bg-white/5 rounded-full px-4 py-1.5">
                  <span className="text-gray-400 text-xs">
                    <span
                      className={`font-semibold text-transparent bg-clip-text bg-gradient-to-r ${userColor.gradient}`}
                    >
                      {displayName}
                    </span>{" "}
                    {msg.message.includes("joined")
                      ? "joined the chat"
                      : msg.message.includes("left")
                      ? "left the chat"
                      : ""}
                  </span>
                </div>
              </div>
            );
          }

          // Regular user messages
          return (
            <div
              key={msg.id || i}
              className="flex items-start gap-2 group animate-fade-in"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              {/* Avatar - Show for all users */}
              <div className="relative flex-shrink-0 mt-0.5">
                {msg.userProfile ? (
                  <>
                    <img
                      src={msg.userProfile}
                      alt={userName}
                      className="w-8 h-8 rounded-full object-cover shadow-lg border-2 border-white/10"
                      onError={(e) => {
                        // Hide image and show fallback if image fails to load
                        const target = e.target as HTMLImageElement;
                        target.style.display = "none";
                        const fallback =
                          target.nextElementSibling as HTMLElement;
                        if (fallback) fallback.style.display = "flex";
                      }}
                    />
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg bg-gradient-to-br ${userColor.bg} hidden`}
                    >
                      {userName.charAt(0).toUpperCase()}
                    </div>
                  </>
                ) : (
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg bg-gradient-to-br ${userColor.bg}`}
                  >
                    {userName.charAt(0).toUpperCase()}
                  </div>
                )}
                {!isCurrentUser && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-[#18181b] rounded-full"></div>
                )}
              </div>

              {/* Message Content */}
              <div className="flex-1 min-w-0 flex flex-col gap-1">
                {/* Show username and email for ALL messages */}
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span
                    className={`font-semibold text-sm text-transparent bg-clip-text bg-gradient-to-r ${userColor.gradient}`}
                  >
                    {userName}
                  </span>

                  <span className="text-gray-500 text-xs">
                    {formatTime(msg.timestamp)}
                  </span>
                </div>
                <div
                  className={`rounded-xl px-3 py-2 transition-all duration-200 rounded-tl-none ${
                    isCurrentUser
                      ? `bg-gradient-to-br from-rose-600/20 via-pink-600/20 to-fuchsia-600/20`
                      : "bg-gradient-to-br from-white/5 to-white/[0.02]"
                  }`}
                >
                  <p className="text-white/90 text-sm leading-relaxed break-words">
                    {msg.message}
                  </p>
                </div>
              </div>
            </div>
          );
        })}

        {/* Typing Indicator */}
        {typingUsers.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-2">
            <div className="flex gap-1">
              <div
                className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                style={{ animationDelay: "0s" }}
              ></div>
              <div
                className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                style={{ animationDelay: "0.2s" }}
              ></div>
              <div
                className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                style={{ animationDelay: "0.4s" }}
              ></div>
            </div>
            <span className="text-gray-400 text-xs">
              {typingUsers.map((u) => u.userName).join(", ")}
              {typingUsers.length === 1 ? " is" : " are"} typing...
            </span>
          </div>
        )}

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Emoji Bar */}
      {showEmojis && (
        <div className="flex gap-2 bg-gradient-to-br from-[#1f1f23] to-[#27272a] p-2 rounded-xl overflow-x-auto scrollbar-hide animate-slide-up">
          {[
            { icon: FaSmile, color: "text-yellow-400" },
            { icon: FaSadTear, color: "text-blue-400" },
            { icon: FaLaughSquint, color: "text-yellow-300" },
            { icon: FaSurprise, color: "text-pink-400" },
            { icon: FaHeart, color: "text-red-500" },
            { icon: FaGrinHearts, color: "text-pink-500" },
          ].map((emoji, i) => {
            const Icon = emoji.icon;
            return (
              <button
                key={i}
                onClick={() => {
                  setMessageInput((prev) => prev + " 😊");
                  setShowEmojis(false);
                }}
                className={`p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-200 hover:scale-110 ${emoji.color}`}
              >
                <Icon size={18} />
              </button>
            );
          })}
        </div>
      )}

      {/* Input Area */}
      <div className="flex items-center gap-1 bg-gradient-to-br from-[#1f1f23] to-[#27272a] rounded-xl px-3 py-1 shadow-lg">
        <input
          ref={inputRef}
          type="text"
          placeholder={isJoined ? "Send a message..." : "Connecting..."}
          value={messageInput}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          disabled={!isJoined || isLoading}
          className="flex-1 bg-transparent outline-none text-white/90 text-sm placeholder:text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <button
          onClick={handleSendMessage}
          disabled={!messageInput.trim() || !isJoined || isLoading}
          className="p-2 rounded-lg text-gray-400 hover:text-pink-400 hover:bg-white/5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FaArrowCircleUp size={20} />
        </button>
        <button
          onClick={() => setShowEmojis(!showEmojis)}
          className={`p-2 rounded-lg transition-all duration-200 ${
            showEmojis
              ? "text-pink-400 bg-pink-500/10"
              : "text-gray-400 hover:text-pink-400 hover:bg-white/5"
          }`}
        >
          <FaSmile size={20} />
        </button>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
          opacity: 0;
        }

        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }

        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default ChatTab;
