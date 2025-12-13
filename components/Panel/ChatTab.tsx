"use client";

import { useState, useRef, useEffect } from "react";
import { FaArrowCircleUp, FaSmile } from "react-icons/fa";
import dynamic from "next/dynamic";
import { useChatContext } from "@/context/ChatContext";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import { ChatMessage, ReactionType } from "@/types/chatTypes";
import type { EmojiClickData, Theme } from "emoji-picker-react";
import AnimatedReaction from "./AnimatedReaction";
import ReactionPicker from "./ReactionPicker";
import { showError } from "@/utils/toast";
import { formatChatTime } from "@/utils/timeFormatter";

const EmojiPicker = dynamic(() => import("emoji-picker-react"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center p-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
    </div>
  ),
});

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

  // Expanded color palette with more distinct colors for better user differentiation
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
    {
      gradient: "from-lime-400 via-green-400 to-emerald-400",
      bg: "from-lime-500 via-green-500 to-emerald-500",
    },
    {
      gradient: "from-amber-400 via-orange-400 to-red-400",
      bg: "from-amber-500 via-orange-500 to-red-500",
    },
    {
      gradient: "from-indigo-400 via-purple-400 to-pink-400",
      bg: "from-indigo-500 via-purple-500 to-pink-500",
    },
    {
      gradient: "from-teal-400 via-cyan-400 to-blue-400",
      bg: "from-teal-500 via-cyan-500 to-blue-500",
    },
    {
      gradient: "from-yellow-400 via-amber-400 to-orange-400",
      bg: "from-yellow-500 via-amber-500 to-orange-500",
    },
    {
      gradient: "from-red-400 via-pink-400 to-rose-400",
      bg: "from-red-500 via-pink-500 to-rose-500",
    },
    {
      gradient: "from-green-400 via-emerald-400 to-teal-400",
      bg: "from-green-500 via-emerald-500 to-teal-500",
    },
  ];

  // Robust hash function to get consistent color for same username
  // Normalize username to lowercase for consistency across all screens
  const normalizedUsername = username.toLowerCase().trim();
  let hash = 0;
  for (let i = 0; i < normalizedUsername.length; i++) {
    const char = normalizedUsername.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return colors[Math.abs(hash) % colors.length];
};

// Check if message contains only emojis (no text)
const isOnlyEmojis = (text: string): boolean => {
  // Remove all emojis and whitespace, if nothing left = only emojis
  const emojiRegex = /[\p{Emoji}\p{Emoji_Component}]/gu;
  const textWithoutEmojis = text.replace(emojiRegex, "").replace(/\s/g, "");
  return textWithoutEmojis.length === 0 && text.trim().length > 0;
};

// Count number of emojis in text
/* const countEmojis = (text: string): number => {
  const emojiRegex = /[\p{Emoji}\p{Emoji_Component}]/gu;
  const matches = text.match(emojiRegex);
  return matches ? matches.length : 0;
}; */

const ChatTab = () => {
  const [showEmojis, setShowEmojis] = useState(false);
  const [messageInput, setMessageInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  // Get user info from Redux
  const user = useSelector((state: RootState) => state.auth.user);

  // Use chat context (shared with ReactionsContainer)
  const {
    messages,
    typingUsers,
    sendMessage,
    sendReaction,
    handleTyping,
    stopTyping,
    isJoined,
    isLoading,
    isConnected,
  } = useChatContext();

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
  const [pinnedReactions, setPinnedReactions] = useState<ReactionType[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("pinnedReactions");
      return saved ? JSON.parse(saved) : DEFAULT_REACTIONS;
    }
    return DEFAULT_REACTIONS;
  });

  // Track which reaction was just clicked for animation
  const [animatingReaction, setAnimatingReaction] =
    useState<ReactionType | null>(null);

  // Save pinned reactions to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("pinnedReactions", JSON.stringify(pinnedReactions));
    }
  }, [pinnedReactions]);

  // Handle reaction pin/unpin
  const handleReactionsChange = (newReactions: ReactionType[]) => {
    setPinnedReactions(newReactions);
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node) &&
        !(event.target as HTMLElement).closest("[data-emoji-button]")
      ) {
        setShowEmojis(false);
      }
    };

    if (showEmojis) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showEmojis]);

  // Handle emoji selection from emoji-picker-react
  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setMessageInput((prev) => prev + emojiData.emoji);
    // Don't close the picker, allow multiple emojis
  };

  // Handle sending message
  const handleSendMessage = async () => {
    if (!messageInput.trim() || !isJoined) return;

    const result = await sendMessage(messageInput);
    if (result.success) {
      setMessageInput("");
      stopTyping();

      // Reset textarea height after sending
      if (inputRef.current) {
        inputRef.current.style.height = "20px";
      }
    } else {
      console.error("Failed to send message:", result.error);
      // Show toast notification for failed message
      showError("Failed to send message", result.error || "Please check your connection and try again.");
    }
  };

  // Handle Enter key press
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
    // Shift+Enter will create a new line (default behavior)
  };

  // Handle input change with typing indicator and line limit
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const lines = value.split("\n");

    // Limit to 10 lines
    if (lines.length > 10) {
      return; // Don't update if exceeds 10 lines
    }

    setMessageInput(value);
    if (value.trim()) {
      handleTyping();
    } else {
      stopTyping();
    }
  };

  // Check if message is from current user
  const isCurrentUserMessage = (message: ChatMessage) => {
    if (!user) return false;

    // Compare by email (most reliable)
    if (user.email && message.userEmail) {
      return user.email.toLowerCase() === message.userEmail.toLowerCase();
    }

    // Compare by username/name
    const currentUserName = (user.name || user.username || "").toLowerCase();
    const messageName = (message.userName || "").toLowerCase();

    return currentUserName === messageName && currentUserName !== "";
  };

  return (
    <div className="flex flex-col h-full w-full gap-3 overflow-visible">
      {/* Connection Status - Modern Design */}
      {!isConnected && (
        <div className="relative px-4 py-2.5 bg-gradient-to-br from-zinc-800/15 via-zinc-700/15 to-zinc-800/15 backdrop-blur-xl border border-yellow-500/20 rounded-xl overflow-hidden">
          <div className="relative flex items-center gap-2">
            <div className="relative">
              <div className="absolute inset-0 bg-yellow-400/20 rounded-full animate-ping"></div>
              <div className="relative w-2 h-2 bg-yellow-400 rounded-full"></div>
            </div>
            <p className="text-yellow-300 text-xs font-medium">Connecting to chat...</p>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="relative px-4 py-2.5 bg-gradient-to-br from-zinc-800/15 via-zinc-700/15 to-zinc-800/15 backdrop-blur-xl border border-blue-500/20 rounded-xl overflow-hidden">
          <div className="relative flex items-center gap-2">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-400/20 rounded-full animate-pulse"></div>
              <div className="relative w-2 h-2 bg-blue-400 rounded-full"></div>
            </div>
            <p className="text-blue-300 text-xs font-medium">Joining chat room...</p>
          </div>
        </div>
      )}

      {/* Chat Messages Area */}
      <div className="flex-1 flex flex-col gap-3 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {messages.length === 0 && isJoined && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-fuchsia-500/20 rounded-full blur-2xl"></div>
              <div className="relative text-6xl opacity-50">💬</div>
            </div>
            <p className="text-white/60 text-sm font-medium">
              No messages yet. Start the conversation!
            </p>
          </div>
        )}

        {messages.map((msg, i) => {
          if (!msg || !msg.message) {
            return null;
          }

          const userName = msg.userName || "Unknown User";
          const isCurrentUser = isCurrentUserMessage(msg);
          const isSystemMessage = msg.type === "system";

            // System messages (user joined/left) - Modern Design
            if (isSystemMessage) {
            // Always use msg.userName first (which gets updated by useChat when USERNAME_UPDATED is received)
            let displayName = userName; // msg.userName (already updated by useChat)

            // For current user's system messages, use current username from Redux
            if (isCurrentUser && user) {
              const currentUsername = user.username || user.name || "";
              if (currentUsername) {
                displayName = currentUsername;
              }
            }
            
            // Only fall back to email extraction if userName is missing or "Unknown User"
            if ((!displayName || displayName === "Unknown User") && msg.userEmail) {
              const emailUsername = msg.userEmail.split("@")[0];
              if (emailUsername) {
                displayName = emailUsername;
              }
            }
            
            // Final fallback: extract from message text
            if (!displayName || displayName === "Unknown User") {
              displayName = msg.message
                .replace(" joined the chat", "")
                .replace(" left the chat", "")
                .trim();
            }

            // Remove "Unknown User" prefix if it exists
            displayName = displayName.replace(/^Unknown User\s+/i, "");

            // Generate color based on the displayed username (extracted from email)
            const userColor = getUserColor(displayName);

            // Check if it's a join/leave message or a host control message
            const isJoinLeaveMessage =
              msg.message.includes("joined") || msg.message.includes("left");
            const isHostControlMessage =
              msg.message.includes("started") ||
              msg.message.includes("paused") ||
              msg.message.includes("resumed") ||
              msg.message.includes("seeked");

            // For host control messages, replace host's username with "YOU" if it's the current user
            let displayMessage = msg.message;
            if (isHostControlMessage && user) {
              // Get the first word from the message (which should be the username)
              const messageWords = displayMessage.split(" ");
              const firstWord = messageWords[0] || "";

              // Get all possible variations of current user's identifiers (normalized to lowercase)
              const currentUserName = (user.name || user.username || "")
                .trim()
                .toLowerCase();
              const currentUserEmail = (user.email || "").trim().toLowerCase();
              const emailUsername = currentUserEmail
                ? currentUserEmail.split("@")[0].toLowerCase()
                : "";
              const messageUserName = (msg.userName || "").trim().toLowerCase();
              const messageUserEmail = (msg.userEmail || "")
                .trim()
                .toLowerCase();
              const messageEmailUsername = messageUserEmail
                ? messageUserEmail.split("@")[0].toLowerCase()
                : "";

              // Normalize first word for comparison
              const firstWordLower = firstWord.toLowerCase();

              // Check if the first word matches ANY of the current user's identifiers
              // This catches: name, username, email, email username, or message userName/email
              const matchesName =
                currentUserName &&
                (firstWordLower === currentUserName ||
                  messageUserName === currentUserName ||
                  messageEmailUsername === currentUserName);

              const matchesEmail =
                emailUsername &&
                (firstWordLower === emailUsername ||
                  messageUserName === emailUsername ||
                  messageEmailUsername === emailUsername);

              const matchesFullEmail =
                currentUserEmail &&
                messageUserEmail &&
                currentUserEmail === messageUserEmail;

              // Also use the isCurrentUser check as a fallback
              const isFromCurrentUser =
                matchesName ||
                matchesEmail ||
                matchesFullEmail ||
                isCurrentUser;

              // If it's from current user, replace first word with "YOU"
              if (isFromCurrentUser) {
                messageWords[0] = "You";
                displayMessage = messageWords.join(" ");
              }
            }

            return (
              <div key={msg.id || i} className="flex justify-center py-1">
                <div className="relative group">
                  {/* Glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-blue-500/10 rounded-full blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  {/* Notification badge */}
                  <div className="relative bg-gradient-to-br from-zinc-800/15 via-zinc-700/15 to-zinc-800/15 backdrop-blur-xl border border-zinc-600/15 rounded-full px-4 py-1.5">
                    <span className="text-white/80 text-xs font-medium">
                      {isJoinLeaveMessage ? (
                        // Join/Leave messages: show username + action with icon
                        <>
                          <span className="inline-flex items-center gap-1">
                            <span className={`font-semibold text-transparent bg-clip-text bg-gradient-to-r ${userColor.gradient}`}>
                              {displayName}
                            </span>
                            <span className="text-white/60">
                              {msg.message.includes("joined") ? (
                                <span className="inline-flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                                  joined
                                </span>
                              ) : msg.message.includes("left") ? (
                                <span className="inline-flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 bg-red-400 rounded-full"></span>
                                  left
                                </span>
                              ) : (
                                ""
                              )}
                            </span>
                          </span>
                        </>
                      ) : isHostControlMessage ? (
                        // Host control messages: show full message (with "YOU" if current user)
                        <span className="text-white/80">{displayMessage}</span>
                      ) : (
                        // Fallback: show username + message
                        <>
                          <span
                            className={`font-semibold text-transparent bg-clip-text bg-gradient-to-r ${userColor.gradient}`}
                          >
                            {displayName}
                          </span>{" "}
                          <span className="text-white/60">{msg.message}</span>
                        </>
                      )}
                    </span>
                  </div>
                  {/* Timestamp for system notifications - shows on hover */}
                  <span className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 text-gray-500/60 text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                    {formatChatTime(msg.timestamp)}
                  </span>
                </div>
              </div>
            );
          }

          // Regular user messages - Modern Design
          const onlyEmojis = isOnlyEmojis(msg.message);
          const emojiSize = "text-4xl";

          // Always use msg.userName first (which gets updated by useChat when USERNAME_UPDATED is received)
          // For current user's messages, also check Redux for the latest username
          let displayUserName = userName; // msg.userName (already updated by useChat)
          
          if (isCurrentUser) {
            // Use current username from Redux for current user's messages (most up-to-date)
            const currentUsername = user?.username || user?.name || "";
            if (currentUsername) {
              displayUserName = currentUsername;
            }
          }
          
          // Only fall back to email extraction if userName is missing or "Unknown User"
          if ((!displayUserName || displayUserName === "Unknown User") && msg.userEmail) {
            const emailUsername = msg.userEmail.split("@")[0];
            if (emailUsername) {
              displayUserName = emailUsername;
            }
          }

          // Generate color based on the displayed username (extracted from email)
          // This ensures same username always gets same color across all screens
          const userColor = getUserColor(displayUserName);

          return (
            <div
              key={msg.id || i}
              className="flex items-start gap-3 group animate-fade-in"
              style={{ animationDelay: `${i * 0.03}s` }}
            >
              {/* Avatar - Modern Design */}
              <div className="relative flex-shrink-0">
                <div className="relative">
                  {/* Glow effect on hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${userColor.bg} rounded-full blur-md opacity-0 group-hover:opacity-30 transition-opacity duration-300`}></div>
                  
                  {msg.userProfile ? (
                    <>
                      <img
                        src={msg.userProfile}
                        alt={displayUserName}
                        className="relative w-10 h-10 rounded-full object-cover shadow-xl border-2 border-white/20 ring-2 ring-white/5"
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
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-xl bg-gradient-to-br ${userColor.bg} border-2 border-white/20 hidden`}
                      >
                        {displayUserName.charAt(0).toUpperCase()}
                      </div>
                    </>
                  ) : (
                    <div
                      className={`relative w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-xl bg-gradient-to-br ${userColor.bg} border-2 border-white/20 ring-2 ring-white/5`}
                    >
                      {displayUserName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  
                  {/* Online status indicator */}
                  {!isCurrentUser && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-[#18181b] rounded-full shadow-lg">
                      <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-75"></div>
                    </div>
                  )}
                </div>
              </div>

              {/* Message Content */}
              <div className="flex-1 min-w-0 flex flex-col gap-1.5 items-start">
                {/* Show username */}
                <div className="flex items-baseline gap-2 min-w-0 w-full">
                  <span
                    className={`font-semibold text-sm text-transparent bg-clip-text bg-gradient-to-r ${userColor.gradient} tracking-tight truncate max-w-[180px]`}
                    title={displayUserName}
                  >
                    {displayUserName}
                  </span>
                </div>

                {/* Emoji-only messages: No bubble, larger size with glow */}
                {onlyEmojis ? (
                  <div className="relative group/emoji p-0.5">
                    <div className="relative inline-block">
                      <div className={`absolute inset-0 bg-gradient-to-br ${userColor.bg} rounded-lg blur-xl opacity-20`}></div>
                      <p className={`relative ${emojiSize} leading-tight filter`}>
                        {msg.message}
                      </p>
                    </div>
                    {/* Timestamp for emoji messages - bottom right */}
                    <span className="absolute -bottom-4 left-0 text-gray-500/60 text-[10px] font-medium opacity-0 group-hover/emoji:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                      {formatChatTime(msg.timestamp)}
                    </span>
                  </div>
                ) : (
                  /* Regular messages: Modern bubble with glassmorphism */
                  <div className="relative group/message w-full">
                    {/* Glow effect */}
                    <div className={`absolute -inset-0.5 bg-gradient-to-br ${userColor.bg} rounded-2xl blur opacity-0 group-hover/message:opacity-20 transition-opacity duration-300`}></div>
                    
                    {/* Message bubble */}
                    <div
                      className={`relative rounded-2xl px-3 py-2.5 transition-all duration-200  backdrop-blur-xl rounded-tl-sm ${
                        isCurrentUser
                          ? `bg-gradient-to-br from-purple-600/15 via-pink-600/10 to-fuchsia-600/10 `
                          : "bg-gradient-to-br from-zinc-800/15 via-zinc-700/15 to-zinc-800/15 "
                      }`}
                    >
                      <p className="text-white/95 text-sm leading-relaxed break-words whitespace-pre-wrap font-medium">
                        {msg.message}
                      </p>
                      <div className="w-full text-right text-white/50 text-[10px] font-medium opacity-60 group-hover/message:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
                        {formatChatTime(msg.timestamp)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {/* Typing Indicator - Different Design from Message Bubbles */}
        {typingUsers.length > 0 && (
          <div className="flex items-center gap-2.5 px-3 py-2">
            <div className="relative flex items-center gap-1">
              <div
                className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce"
                style={{ animationDelay: "0s" }}
              ></div>
              <div
                className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce"
                style={{ animationDelay: "0.2s" }}
              ></div>
              <div
                className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce"
                style={{ animationDelay: "0.4s" }}
              ></div>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-br from-zinc-800/15 via-zinc-700/15 to-zinc-800/15 backdrop-blur-xl border border-cyan-500/20 rounded-lg">
              <span className="text-cyan-300 text-xs font-medium">
                <span className="font-semibold">
                  {typingUsers.map((u) => u.userName).join(", ")}
                </span>
                <span className="text-cyan-400/70 ml-1.5">
                  {typingUsers.length === 1 ? "is" : "are"} typing...
                </span>
              </span>
            </div>
          </div>
        )}

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Reaction Buttons - Modern Design */}
      <div className="relative flex items-center justify-center gap-3 ">
        {/* Pinned Reactions - Centered */}
        {pinnedReactions.map((emoji) => (
          <AnimatedReaction
            key={emoji}
            emoji={emoji}
            isAnimating={animatingReaction === emoji}
            disabled={!isJoined}
            onClick={() => {
              console.log("Reaction clicked:", emoji);
              setAnimatingReaction(emoji);
              sendReaction(emoji);

              // Reset animation after it completes
              setTimeout(() => {
                setAnimatingReaction(null);
              }, 600); // Match the animation duration
            }}
          />
        ))}

        {/* Divider */}
        <div className="w-px h-8 bg-gradient-to-b from-transparent via-white/20 to-transparent" />

        {/* Reaction Picker Button - Positioned for proper alignment */}
        <div className="relative">
          <ReactionPicker
            pinnedReactions={pinnedReactions}
            onReactionsChange={handleReactionsChange}
          />
        </div>
      </div>

      {/* Input Area - Modern Design */} 
      <div className="relative flex items-center gap-1 bg-gradient-to-br from-zinc-800/15 via-zinc-700/15 to-zinc-800/15 backdrop-blur-xl border border-zinc-600/15 rounded-2xl px-3 py-1.5 shadow-2xl overflow-visible">
        {/* Emoji Picker */}
        {showEmojis && (
          <div
            ref={emojiPickerRef}
            className="absolute bottom-full left-0 right-0 mb-2 rounded-2xl animate-slide-up z-[100] overflow-hidden emoji-picker-container"
            style={{ minWidth: "280px" }}
          >
            <EmojiPicker
              onEmojiClick={handleEmojiClick}
              theme={"dark" as Theme}
              searchPlaceHolder="Search emojis..."
              width="100%"
              height="400px"
              previewConfig={{
                showPreview: false,
              }}
              skinTonesDisabled={false}
              searchDisabled={false}
              lazyLoadEmojis={true}
              style={
                {
                  "--epr-bg-color": "#1f1f23",
                  "--epr-category-label-bg-color": "#1f1f23",
                  "--epr-search-input-bg-color": "rgba(255, 255, 255, 0.05)",
                  "--epr-search-input-bg-color-active":
                    "rgba(255, 255, 255, 0.1)",
                  "--epr-search-input-text-color": "#ffffff",
                  "--epr-search-input-placeholder-color": "#9ca3af",
                  "--epr-category-icon-active-color": "transparent",
                  "--epr-skin-tone-picker-menu-color": "#27272a",
                  "--epr-horizontal-padding": "8px",
                  "--epr-emoji-size": "24px",
                  "--epr-category-padding": "4px",
                  "--epr-search-input-height": "32px",
                  "--epr-search-input-padding": "6px 10px 6px 32px",
                  "--epr-search-input-font-size": "12px",
                  "--epr-category-navigation-button-size": "28px",
                  "--epr-header-padding": "6px 8px 4px 8px",
                  "--epr-category-label-height": "24px",
                  "--epr-category-label-padding": "0 8px",
                  "--epr-text-color": "#9ca3af",
                  "--epr-category-label-text-color": "#9ca3af",
                  "--epr-skin-tone-picker-menu-padding": "10px 12px",
                  "--epr-skin-tone-picker-menu-border-radius": "8px",
                } as React.CSSProperties
              }
            />
          </div>
        )}
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          placeholder={isJoined ? "Send a message..." : "Connecting..."}
          value={messageInput}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          disabled={!isJoined || isLoading}
          rows={1}
          className="flex-1 bg-transparent outline-none text-white/95 text-sm placeholder:text-white/40 disabled:opacity-50 disabled:cursor-not-allowed resize-none overflow-y-auto max-h-[240px] font-medium"
          style={{
            minHeight: "24px",
            maxHeight: "240px", // ~10 lines (24px per line)
          }}
          onInput={(e) => {
            // Auto-resize textarea based on content
            const target = e.target as HTMLTextAreaElement;
            target.style.height = "24px";
            target.style.height = Math.min(target.scrollHeight, 240) + "px";
          }}
        />
        <button
          onClick={handleSendMessage}
          disabled={!messageInput.trim() || !isJoined || isLoading}
          className="relative p-2 rounded-xl text-white/70 hover:text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-pink-600/20 to-fuchsia-600/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <FaArrowCircleUp size={20} className="relative" />
        </button>
        <button
          data-emoji-button
          onClick={() => setShowEmojis(!showEmojis)}
          className={`relative p-2 rounded-xl transition-all duration-200 group ${
            showEmojis
              ? "text-pink-400"
              : "text-white/70 hover:text-pink-400"
          }`}
        >
          <div className={`absolute inset-0 rounded-xl transition-all duration-200 ${
            showEmojis
              ? "bg-gradient-to-br from-purple-600/20 via-pink-600/20 to-fuchsia-600/20"
              : "bg-gradient-to-br from-zinc-800/10 via-zinc-700/10 to-zinc-800/10 opacity-0 group-hover:opacity-100"
          }`}></div>
          <FaSmile size={20} className="relative" />
        </button>
      </div>

      <style jsx global>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(8px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(12px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          opacity: 0;
        }

        .animate-slide-up {
          animation: slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }

        /* Skin tone picker custom styling */
        .epr-skin-tones {
          margin-right: 8px !important;
          margin-left: 10px !important;
          border-radius: 10px !important;
        }

        .epr-skin-tone-select {
          margin-left: 8px !important;
          margin-right: 8px !important;
        }

        /* Responsive emoji picker styles */
        /* Small screens (sm: 640px) */
        @media (max-width: 639px) {
          .emoji-picker-container {
            min-width: 260px !important;
          }
          .emoji-picker-container .epr-emoji-size {
            --epr-emoji-size: 20px !important;
          }
          .emoji-picker-container .EmojiPickerReact {
            --epr-emoji-size: 20px !important;
            --epr-category-navigation-button-size: 24px !important;
            --epr-search-input-height: 28px !important;
            --epr-search-input-font-size: 11px !important;
            --epr-horizontal-padding: 6px !important;
            --epr-category-padding: 3px !important;
            --epr-header-padding: 5px 6px 3px 6px !important;
            --epr-category-label-height: 20px !important;
            --epr-category-label-padding: 0 6px !important;
          }
        }

        /* Medium screens (md: 768px) */
        @media (min-width: 640px) and (max-width: 767px) {
          .emoji-picker-container {
            min-width: 280px !important;
          }
          .emoji-picker-container .EmojiPickerReact {
            --epr-emoji-size: 22px !important;
            --epr-category-navigation-button-size: 26px !important;
            --epr-search-input-height: 30px !important;
            --epr-search-input-font-size: 11px !important;
            --epr-horizontal-padding: 7px !important;
            --epr-category-padding: 3px !important;
            --epr-header-padding: 5px 7px 3px 7px !important;
            --epr-category-label-height: 22px !important;
            --epr-category-label-padding: 0 7px !important;
          }
        }

        /* Large screens (lg: 1024px) */
        @media (min-width: 768px) and (max-width: 1023px) {
          .emoji-picker-container {
            min-width: 300px !important;
          }
          .emoji-picker-container .EmojiPickerReact {
            --epr-emoji-size: 23px !important;
            --epr-category-navigation-button-size: 27px !important;
            --epr-search-input-height: 31px !important;
            --epr-search-input-font-size: 11.5px !important;
            --epr-horizontal-padding: 7px !important;
            --epr-category-padding: 3px !important;
            --epr-header-padding: 5px 7px 3px 7px !important;
            --epr-category-label-height: 23px !important;
            --epr-category-label-padding: 0 7px !important;
          }
        }

        /* Extra large screens (xl: 1280px) */
        @media (min-width: 1024px) and (max-width: 1535px) {
          .emoji-picker-container {
            min-width: 320px !important;
          }
          .emoji-picker-container .EmojiPickerReact {
            --epr-emoji-size: 23px !important;
            --epr-category-navigation-button-size: 27px !important;
            --epr-search-input-height: 31px !important;
            --epr-search-input-font-size: 11.5px !important;
            --epr-horizontal-padding: 7px !important;
            --epr-category-padding: 3px !important;
            --epr-header-padding: 5px 7px 3px 7px !important;
            --epr-category-label-height: 23px !important;
            --epr-category-label-padding: 0 7px !important;
          }
        }

        /* 2xl screens and above (1536px+) - keep original settings */
        @media (min-width: 1536px) {
          /* Original 2xl styles are already applied in inline styles */
        }
      `}</style>
    </div>
  );
};

export default ChatTab;
