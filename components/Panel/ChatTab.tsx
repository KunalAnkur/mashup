"use client";

import { useState, useRef, useEffect, useLayoutEffect, useMemo, useCallback } from "react";
import { LuArrowUp, LuPin, LuSmile } from "react-icons/lu";
import { MdCelebration, MdOutlineCelebration } from "react-icons/md";
import dynamic from "next/dynamic";
import { useChatContext } from "@/context/ChatContext";
import { useRoomContext } from "@/context/RoomContext";
import { useSocket } from "@/context/SocketContext";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import { ChatMessage, MessageReaction, ReactionType } from "@/types/chatTypes";
import type { EmojiClickData, Theme } from "emoji-picker-react";
import AnimatedReaction from "./AnimatedReaction";
import MessageReactionDetails from "./MessageReactionDetails";
import MessageReactionPicker from "./MessageReactionPicker";
import ReactionPicker from "./ReactionPicker";
import { showError } from "@/utils/toast";
import { formatChatTime } from "@/utils/timeFormatter";
import { isMobile } from "react-device-detect";
import { useTranslations } from "@/i18n/I18nProvider";
import { getEmailPrefix, isGenericName } from "@/utils/chatName";

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

  const normalizedUsername = username.toLowerCase().trim();
  let hash = 0;
  for (let i = 0; i < normalizedUsername.length; i++) {
    const char = normalizedUsername.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return colors[Math.abs(hash) % colors.length];
};

const isOnlyEmojis = (text: string): boolean => {
  const emojiRegex = /[\p{Emoji}\p{Emoji_Component}]/gu;
  const textWithoutEmojis = text.replace(emojiRegex, "").replace(/\s/g, "");
  return textWithoutEmojis.length === 0 && text.trim().length > 0;
};

const PIN_MESSAGE_CHAR_LIMIT = 180;
const MESSAGE_REACTION_PICKER_APPROX_HEIGHT = 52;
const MESSAGE_REACTION_DETAILS_APPROX_WIDTH = 208;
const MESSAGE_REACTION_PICKER_VERTICAL_OFFSET = 8;
const MESSAGE_ACTIONS_MIN_SIDE_SPACE = 72;
const MESSAGE_ACTIONS_WIDE_BUBBLE_RATIO = 0.72;
const MESSAGE_REACTION_DETAILS_VIEWPORT_PADDING = 12;

type MessageReactionPlacement = "top" | "bottom";
type MessageActionPlacement = "side" | "top";
type ActiveReactionDetails = {
  messageId: string;
  emoji: ReactionType;
  popupAlign: "start" | "end";
} | null;

const ChatTab = () => {
  const [showEmojis, setShowEmojis] = useState(false);
  const [showReactions, setShowReactions] = useState(true);
  const [activeReactionMessageId, setActiveReactionMessageId] = useState<string | null>(null);
  const [activeReactionPlacement, setActiveReactionPlacement] =
    useState<MessageReactionPlacement>("top");
  const [activeReactionDetails, setActiveReactionDetails] =
    useState<ActiveReactionDetails>(null);
  const [messageActionPlacements, setMessageActionPlacements] = useState<
    Record<string, MessageActionPlacement>
  >({});
  const [messageInput, setMessageInput] = useState("");
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const lastMessageCountRef = useRef(0);
  const shouldAutoScrollRef = useRef(true);
  const messageBubbleRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  const { socket } = useSocket();
  const user = useSelector((state: RootState) => state.auth.user);
  const { participants, isHost } = useRoomContext();
  const t = useTranslations("panel.chat");
  const tToast = useTranslations("toast");
  const tCommon = useTranslations("common");

  const {
    messages,
    typingUsers,
    sendMessage,
    sendReaction,
    pinMessage,
    unpinMessage,
    pinnedMessage,
    toggleMessageReaction,
    handleTyping,
    stopTyping,
    isJoined,
    isLoading,
    isConnected,
  } = useChatContext();
  const [pinActionLoadingId, setPinActionLoadingId] = useState<string | null>(null);

  const DEFAULT_REACTIONS: ReactionType[] = [
    "😍",
    "😡",
    "😭",
    "😂",
    "🤯",
    "🔥",
  ];

  const [pinnedReactions, setPinnedReactions] = useState<ReactionType[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("pinnedReactions");
      return saved ? JSON.parse(saved) : DEFAULT_REACTIONS;
    }
    return DEFAULT_REACTIONS;
  });

  const [animatingReaction, setAnimatingReaction] =
    useState<ReactionType | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("pinnedReactions", JSON.stringify(pinnedReactions));
    }
  }, [pinnedReactions]);

  const handleReactionsChange = (newReactions: ReactionType[]) => {
    setPinnedReactions(newReactions);
  };

  const isNearBottom = (container: HTMLDivElement) => {
    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    return distanceFromBottom <= 24;
  };

  const handleMessagesScroll = () => {
    const container = messagesContainerRef.current;
    if (!container) return;

    shouldAutoScrollRef.current = isNearBottom(container);

    if (activeReactionMessageId) {
      setActiveReactionMessageId(null);
    }

    if (activeReactionDetails) {
      setActiveReactionDetails(null);
    }
  };

  useLayoutEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    if (messages.length === lastMessageCountRef.current) return;
    lastMessageCountRef.current = messages.length;

    if (!shouldAutoScrollRef.current) return;

    container.scrollTop = container.scrollHeight;
  }, [messages.length]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (
        showEmojis &&
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(target) &&
        !inputRef.current?.contains(target) &&
        !(event.target as HTMLElement).closest("[data-emoji-button]")
      ) {
        setShowEmojis(false);
      }

      if (activeReactionMessageId) {
        const activeBubble = messageBubbleRefs.current[activeReactionMessageId];
        if (activeBubble && !activeBubble.contains(target)) {
          setActiveReactionMessageId(null);
        }
      }

      if (activeReactionDetails) {
        const activeBubble = messageBubbleRefs.current[activeReactionDetails.messageId];
        if (activeBubble && !activeBubble.contains(target)) {
          setActiveReactionDetails(null);
        }
      }
    };

    if (showEmojis || activeReactionMessageId || activeReactionDetails) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showEmojis, activeReactionMessageId, activeReactionDetails]);

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setMessageInput((prev) => prev + emojiData.emoji);
  };

  const handleSendMessage = async () => {
    const trimmedMessage = messageInput.trim();
    if (!trimmedMessage || !isJoined) return;

    setMessageInput("");
    stopTyping();
    if (inputRef.current && inputRef.current instanceof HTMLTextAreaElement) {
      inputRef.current.style.height = "20px";
    }

    const result = await sendMessage(trimmedMessage);
    if (result.success) {
      return;
    } else {
      setMessageInput(trimmedMessage);
      console.error("Failed to send message:", result.error);
      showError(tToast("failedToSendMessage"), result.error || tToast("checkConnection"));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    // When Send button is pressed, send message
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      handleSendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = e.target.value;
    
    // For textarea (desktop), limit to 10 lines
    if (!isMobile) {
      const lines = value.split("\n");
      if (lines.length > 10) {
        return;
      }
    }

    setMessageInput(value);
    if (value.trim()) {
      handleTyping();
    } else {
      stopTyping();
    }
  };

  const isCurrentUserMessage = (message: ChatMessage) => {
    if (!user) return false;
    if (user.email && message.userEmail) {
      return user.email.toLowerCase() === message.userEmail.toLowerCase();
    }
    const currentUserName = (user.username || user.name || "").toLowerCase();
    const messageName = (message.userName || "").toLowerCase();
    return currentUserName === messageName && currentUserName !== "";
  };

  const isSameUser = (msg1: ChatMessage, msg2: ChatMessage): boolean => {
    if (!msg1 || !msg2) return false;
    if (msg1.type === "system" || msg2.type === "system") return false;
    if (msg1.userEmail && msg2.userEmail) {
      return msg1.userEmail.toLowerCase() === msg2.userEmail.toLowerCase();
    }
    const userName1 = (msg1.userName || "").toLowerCase();
    const userName2 = (msg2.userName || "").toLowerCase();
    return userName1 === userName2 && userName1 !== "";
  };

  const latestMessageNameByUserId = useMemo(() => {
    const nameByUserId = new Map<string, string>();
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      const message = messages[i];
      if (!message?.userId || nameByUserId.has(message.userId)) continue;
      if (!isGenericName(message.userName)) {
        nameByUserId.set(message.userId, message.userName);
      }
    }
    return nameByUserId;
  }, [messages]);

  const typingDisplayNames = useMemo(() => {
    const resolvedNames = typingUsers
      .map((typingUser) => {
        const participant = participants.find(
          (roomUser) => roomUser.socketId === typingUser.userId
        );
        const participantName = participant?.username || participant?.name || "";
        if (!isGenericName(participantName)) {
          return participantName;
        }

        const recentMessageName = latestMessageNameByUserId.get(typingUser.userId);
        if (recentMessageName && !isGenericName(recentMessageName)) {
          return recentMessageName;
        }

        if (!isGenericName(typingUser.userName)) {
          return typingUser.userName;
        }

        const participantEmailPrefix = getEmailPrefix(participant?.email);
        if (participantEmailPrefix) {
          return participantEmailPrefix;
        }

        return "User";
      })
      .filter((name) => name.trim().length > 0);

    return Array.from(new Set(resolvedNames));
  }, [typingUsers, participants, latestMessageNameByUserId]);

  const handlePinFromMessage = async (message: ChatMessage) => {
    if (!isHost || !message?.id) return;

    const normalizedLength = message.message.trim().length;
    if (normalizedLength === 0 || normalizedLength > PIN_MESSAGE_CHAR_LIMIT) {
      showError(
        t("pinMessageErrorTitle"),
        t("pinMessageLengthError", { max: String(PIN_MESSAGE_CHAR_LIMIT) })
      );
      return;
    }

    setPinActionLoadingId(message.id);

    const isAlreadyPinned = pinnedMessage?.id === message.id;
    const response = isAlreadyPinned ? await unpinMessage() : await pinMessage(message.id);

    setPinActionLoadingId(null);

    if (!response.success) {
      showError(t("pinMessageErrorTitle"), response.error || t("pinMessageErrorFallback"));
    }
  };

  const handleUnpinFromBanner = async () => {
    if (!isHost || !pinnedMessage) return;

    setPinActionLoadingId(pinnedMessage.id);
    const response = await unpinMessage();
    setPinActionLoadingId(null);

    if (!response.success) {
      showError(t("pinMessageErrorTitle"), response.error || t("pinMessageErrorFallback"));
    }
  };

  const getReactionOwnerKey = (reaction: MessageReaction) =>
    reaction.userEmail?.trim().toLowerCase() || reaction.userId;

  const currentReactionOwnerKey =
    user?.email?.trim().toLowerCase() || socket?.id || "";

  const getCurrentUserReaction = (message: ChatMessage): ReactionType | null => {
    const reaction = (message.reactions || []).find(
      (entry) => getReactionOwnerKey(entry) === currentReactionOwnerKey
    );
    return reaction?.emoji || null;
  };

  const getMessageReactionGroups = (message: ChatMessage) => {
    const groupedReactions = new Map<
      ReactionType,
      {
        emoji: ReactionType;
        count: number;
        reactedByCurrentUser: boolean;
        reactors: string[];
        latestReactedAt: number;
      }
    >();

    (message.reactions || []).forEach((reaction) => {
      const existingGroup = groupedReactions.get(reaction.emoji);
      if (existingGroup) {
        existingGroup.count += 1;
        existingGroup.reactors.push(reaction.userName);
        existingGroup.reactedByCurrentUser =
          existingGroup.reactedByCurrentUser ||
          getReactionOwnerKey(reaction) === currentReactionOwnerKey;
        existingGroup.latestReactedAt = Math.max(
          existingGroup.latestReactedAt,
          reaction.reactedAt
        );
        return;
      }

      groupedReactions.set(reaction.emoji, {
        emoji: reaction.emoji,
        count: 1,
        reactedByCurrentUser:
          getReactionOwnerKey(reaction) === currentReactionOwnerKey,
        reactors: [reaction.userName],
        latestReactedAt: reaction.reactedAt,
      });
    });

    return Array.from(groupedReactions.values()).sort((left, right) => {
      if (left.reactedByCurrentUser !== right.reactedByCurrentUser) {
        return left.reactedByCurrentUser ? -1 : 1;
      }
      if (left.count !== right.count) {
        return right.count - left.count;
      }
      return right.latestReactedAt - left.latestReactedAt;
    });
  };

  const handleMessageReactionSelect = (messageId: string, emoji: ReactionType) => {
    toggleMessageReaction(messageId, emoji);
    setActiveReactionMessageId(null);
    setActiveReactionDetails(null);
  };

  const resolveMessageOverlayPlacement = (
    messageId: string,
    overlayHeight: number
  ): MessageReactionPlacement => {
    const bubbleElement = messageBubbleRefs.current[messageId];
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
  };

  const updateMessageReactionPlacement = useCallback((messageId: string) => {
    setActiveReactionPlacement(
      resolveMessageOverlayPlacement(
        messageId,
        MESSAGE_REACTION_PICKER_APPROX_HEIGHT
      )
    );
  }, []);

  const handleReactionPickerToggle = (messageId: string) => {
    setActiveReactionDetails(null);
    setActiveReactionMessageId((current) => {
      if (current === messageId) {
        return null;
      }

      updateMessageReactionPlacement(messageId);
      return messageId;
    });
  };

  const handleReactionDetailsToggle = (
    messageId: string,
    emoji: ReactionType,
    popupAlign: "start" | "end"
  ) => {
    setActiveReactionMessageId(null);
    setActiveReactionDetails((current) => {
      if (
        current?.messageId === messageId &&
        current.emoji === emoji
      ) {
        return null;
      }

      return { messageId, emoji, popupAlign };
    });
  };

  const resolveReactionDetailsAlign = (
    triggerRect: DOMRect
  ): "start" | "end" => {
    if (typeof window === "undefined") {
      return "start";
    }

    const requiredWidth =
      MESSAGE_REACTION_DETAILS_APPROX_WIDTH +
      MESSAGE_REACTION_DETAILS_VIEWPORT_PADDING;
    const availableRight =
      window.innerWidth - triggerRect.left - MESSAGE_REACTION_DETAILS_VIEWPORT_PADDING;
    const availableLeft =
      triggerRect.right - MESSAGE_REACTION_DETAILS_VIEWPORT_PADDING;

    if (availableRight >= requiredWidth) {
      return "start";
    }

    if (availableLeft >= requiredWidth) {
      return "end";
    }

    return availableRight >= availableLeft ? "start" : "end";
  };

  useEffect(() => {
    if (!activeReactionMessageId) return;

    const handleViewportChange = () => {
      if (activeReactionMessageId) {
        updateMessageReactionPlacement(activeReactionMessageId);
      }
    };

    const containerElement = messagesContainerRef.current;
    window.addEventListener("resize", handleViewportChange);
    containerElement?.addEventListener("scroll", handleViewportChange, { passive: true });

    return () => {
      window.removeEventListener("resize", handleViewportChange);
      containerElement?.removeEventListener("scroll", handleViewportChange);
    };
  }, [activeReactionMessageId, messageActionPlacements, updateMessageReactionPlacement]);

  useEffect(() => {
    if (!activeReactionMessageId && !activeReactionDetails) return;

    const handleViewportScroll = () => {
      setActiveReactionMessageId(null);
      setActiveReactionDetails(null);
    };

    window.addEventListener("scroll", handleViewportScroll, true);

    return () => {
      window.removeEventListener("scroll", handleViewportScroll, true);
    };
  }, [activeReactionDetails, activeReactionMessageId]);

  const resolveMessageActionPlacement = (
    messageId: string
  ): MessageActionPlacement => {
    const bubbleElement = messageBubbleRefs.current[messageId];
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
  };

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
  }, [messages]);

  const renderMessageReactionChips = (message: ChatMessage) => {
    const reactionGroups = getMessageReactionGroups(message);
    if (!reactionGroups.length) return null;
    const isDetailsOpen = activeReactionDetails?.messageId === message.id;

    return (
      <div
        className={`pointer-events-none absolute bottom-0 right-0 max-w-[min(calc(100%-0.5rem),calc(100vw-3rem))] translate-y-1/2 flex-col items-end ${
          isDetailsOpen ? "z-40" : "z-10"
        }`}
      >
        <div className="inline-flex max-w-full flex-wrap items-center justify-end gap-1 rounded-full bg-zinc-950/85 px-1.5 py-1 shadow-[0_10px_24px_rgba(0,0,0,0.18)] backdrop-blur-md">
          {reactionGroups.map((group) => (
            <div
              key={`${message.id}-${group.emoji}`}
              className="relative inline-flex"
            >
              <button
                type="button"
                onClick={(event) =>
                  handleReactionDetailsToggle(
                    message.id,
                    group.emoji,
                    resolveReactionDetailsAlign(
                      event.currentTarget.getBoundingClientRect()
                    )
                  )
                }
                className={`pointer-events-auto inline-flex cursor-pointer items-center gap-1 rounded-full px-1 py-0.5 text-[10px] md:text-[11px] transition-colors duration-150 ${
                  group.reactedByCurrentUser
                    ? "font-semibold text-white"
                    : "font-medium text-white/80 hover:text-white"
                }`}
                title={t("viewMessageReactions")}
              >
                <span className="leading-none">{group.emoji}</span>
                {group.count > 1 && <span>{group.count}</span>}
              </button>
              {isDetailsOpen && activeReactionDetails?.emoji === group.emoji && (
                <MessageReactionDetails
                  align={activeReactionDetails.popupAlign}
                  reactions={message.reactions || []}
                  focusedEmoji={activeReactionDetails.emoji}
                  currentUserOwnerKey={currentReactionOwnerKey}
                  getReactionOwnerKey={getReactionOwnerKey}
                  currentUserLabel={tCommon("you")}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderMessageBubbleActions = ({
    message,
    showPinAction,
    canPinMessage,
    isPinnedMessage,
    pinButtonTitle,
  }: {
    message: ChatMessage;
    showPinAction: boolean;
    canPinMessage: boolean;
    isPinnedMessage: boolean;
    pinButtonTitle: string;
  }) => {
    const actionPlacement = messageActionPlacements[message.id] || "side";

    return (
      <div
        className={`pointer-events-none absolute z-20 flex items-center gap-0.5 ${
          actionPlacement === "top"
            ? "right-1.5 top-0 -translate-y-[42%]"
            : "left-full top-1/2 ml-1 -translate-y-1/2"
        }`}
      >
        <div className="pointer-events-auto flex items-center gap-2 rounded-full bg-zinc-950/88 p-1 shadow-lg backdrop-blur-xl transition-opacity duration-150 opacity-100 md:opacity-0 md:group-hover/message:opacity-100 md:group-focus-within/message:opacity-100">
          <button
            type="button"
            onClick={() => handleReactionPickerToggle(message.id)}
            disabled={!isJoined}
            className="flex h-6.5 w-6.5 items-center justify-center rounded-full text-white/70 transition-colors duration-150 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            title={t("reactToMessage")}
          >
            <LuSmile size={11} />
          </button>
          {showPinAction && (
          <button
            type="button"
            onClick={() => canPinMessage && handlePinFromMessage(message)}
            disabled={pinActionLoadingId === message.id || !canPinMessage}
            className={`flex h-6.5 w-6.5 items-center justify-center rounded-full transition-colors duration-150 disabled:cursor-not-allowed ${
              isPinnedMessage
                ? "text-white/95"
                : canPinMessage
                  ? "text-white/50 hover:text-white/90"
                  : "text-white/30"
            } ${canPinMessage ? "" : "disabled:opacity-55"}`}
            title={pinButtonTitle}
          >
            <LuPin size={12} className="rotate-[18deg] md:h-[13px] md:w-[13px]" />
          </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full w-full gap-2 md:gap-3 overflow-visible">
      {!isConnected && (
        <div className="relative px-3 md:px-4 py-2 md:py-2.5 bg-gradient-to-br from-zinc-800/15 via-zinc-700/15 to-zinc-800/15 backdrop-blur-xl border border-yellow-500/20 rounded-lg md:rounded-xl overflow-hidden">
          <div className="relative flex items-center gap-1.5 md:gap-2">
            <div className="relative">
              <div className="absolute inset-0 bg-yellow-400/20 rounded-full animate-ping"></div>
              <div className="relative w-1.5 h-1.5 md:w-2 md:h-2 bg-yellow-400 rounded-full"></div>
            </div>
            <p className="text-yellow-300 text-[10px] md:text-xs font-medium">{t("connectingToChat")}</p>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="relative px-3 md:px-4 py-2 md:py-2.5 bg-gradient-to-br from-zinc-800/15 via-zinc-700/15 to-zinc-800/15 backdrop-blur-xl border border-blue-500/20 rounded-lg md:rounded-xl overflow-hidden">
          <div className="relative flex items-center gap-1.5 md:gap-2">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-400/20 rounded-full animate-pulse"></div>
              <div className="relative w-1.5 h-1.5 md:w-2 md:h-2 bg-blue-400 rounded-full"></div>
            </div>
            <p className="text-blue-300 text-[10px] md:text-xs font-medium">{t("joiningChatRoom")}</p>
          </div>
        </div>
      )}

      {pinnedMessage && (
        <div className="relative px-3 md:px-4 py-2 md:py-2.5 bg-gradient-to-r from-zinc-800/25 via-amber-300/10 to-zinc-800/25 backdrop-blur-xl border border-amber-200/20 rounded-lg md:rounded-xl overflow-hidden">
          <div className="flex items-start justify-between gap-2 md:gap-3">
            <p className="min-w-0 flex-1 text-[11px] md:text-xs text-white/90 leading-snug whitespace-pre-wrap">
              <span className="font-medium text-white/95 whitespace-nowrap">
                {pinnedMessage.userName}:
              </span>
              <span style={{ overflowWrap: "anywhere" }}> {pinnedMessage.message}</span>
            </p>

            <button
              onClick={isHost ? handleUnpinFromBanner : undefined}
              disabled={!isHost || pinActionLoadingId === pinnedMessage.id}
              className={`mt-0.5 h-4 w-4 md:h-[18px] md:w-[18px] flex-shrink-0 flex items-center justify-center text-white transition-opacity duration-200 ${
                isHost ? "opacity-90 hover:opacity-100" : "opacity-80"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              title={isHost ? t("unpinMessage") : t("pinnedMessage")}
            >
              <LuPin size={13} className="rotate-[18deg] md:w-[14px] md:h-[14px]" />
            </button>
          </div>
        </div>
      )}

      <div
        ref={messagesContainerRef}
        onScroll={handleMessagesScroll}
        className="flex-1 flex flex-col gap-2 md:gap-3 overflow-y-auto pr-1 md:pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
      >
        {messages.length === 0 && isJoined && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full gap-2 md:gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-fuchsia-500/20 rounded-full blur-2xl"></div>
              <div className="relative text-4xl md:text-6xl opacity-50">💬</div>
            </div>
            <p className="text-white/60 text-xs md:text-sm font-medium text-center px-4">
              {t("noMessages")}
            </p>
          </div>
        )}

        {messages.map((msg, i) => {
          if (!msg || !msg.message) return null;

          const userName = msg.userName || "Unknown User";
          const isCurrentUser = isCurrentUserMessage(msg);
          const isSystemMessage = msg.type === "system";
          const prevMessage = i > 0 ? messages[i - 1] : null;
          const isGroupedMessage = prevMessage && isSameUser(msg, prevMessage) && !isSystemMessage;

          if (isSystemMessage) {
            let displayName = userName;

            if (isCurrentUser && user) {
              const currentUsername = user.username || user.name || "";
              if (currentUsername) displayName = currentUsername;
            }

            if ((!displayName || displayName === "Unknown User") && msg.userEmail) {
              const emailUsername = msg.userEmail.split("@")[0];
              if (emailUsername) displayName = emailUsername;
            }

            if (!displayName || displayName === "Unknown User") {
              displayName = msg.message
                .replace(" joined the chat", "")
                .replace(" left the chat", "")
                .trim();
            }

            displayName = displayName.replace(/^Unknown User\s+/i, "");
            const userColor = getUserColor(displayName);

            const isJoinLeaveMessage =
              msg.message.includes("joined") || msg.message.includes("left");
            const isHostControlMessage =
              msg.message.includes("started") ||
              msg.message.includes("paused") ||
              msg.message.includes("resumed") ||
              msg.message.includes("seeked");

            let displayMessage = msg.message;
            if (isHostControlMessage && user) {
              const messageWords = displayMessage.split(" ");
              const firstWord = messageWords[0] || "";

              const currentUserName = (user.username || user.name || "").trim().toLowerCase();
              const currentUserEmail = (user.email || "").trim().toLowerCase();
              const emailUsername = currentUserEmail ? currentUserEmail.split("@")[0].toLowerCase() : "";
              const messageUserName = (msg.userName || "").trim().toLowerCase();
              const messageUserEmail = (msg.userEmail || "").trim().toLowerCase();
              const messageEmailUsername = messageUserEmail ? messageUserEmail.split("@")[0].toLowerCase() : "";

              const firstWordLower = firstWord.toLowerCase();

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

              const isFromCurrentUser = matchesName || matchesEmail || matchesFullEmail || isCurrentUser;

              if (isFromCurrentUser) {
                // Replace action words with translated "You" versions
                if (displayMessage.includes("started the video")) {
                  displayMessage = t("youStarted");
                } else if (displayMessage.includes("paused the video")) {
                  displayMessage = t("youPaused");
                } else if (displayMessage.includes("resumed the video")) {
                  displayMessage = t("youResumed");
                } else if (displayMessage.includes("seeked to")) {
                  const timeMatch = displayMessage.match(/seeked to (.+)/);
                  if (timeMatch) {
                    displayMessage = `${t("youSeeked")} ${timeMatch[1]}`;
                  } else {
                    displayMessage = t("youSeeked");
                  }
                } else {
                  messageWords[0] = t("you");
                  displayMessage = messageWords.join(" ");
                }
              } else {
                // Translate action words for other users
                if (displayMessage.includes("started the video")) {
                  displayMessage = displayMessage.replace("started the video", t("started"));
                } else if (displayMessage.includes("paused the video")) {
                  displayMessage = displayMessage.replace("paused the video", t("paused"));
                } else if (displayMessage.includes("resumed the video")) {
                  displayMessage = displayMessage.replace("resumed the video", t("resumed"));
                } else if (displayMessage.includes("seeked to")) {
                  displayMessage = displayMessage.replace("seeked to", t("seeked"));
                }
              }
            }

            return (
              <div key={msg.id || i} className="flex justify-center py-1">
                <div className="relative group">
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-blue-500/10 rounded-full blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative bg-gradient-to-br from-zinc-800/15 via-zinc-700/15 to-zinc-800/15 backdrop-blur-xl border border-zinc-600/15 rounded-full px-4 py-1.5">
                    <span className="text-white/80 text-xs font-medium">
                      {isJoinLeaveMessage ? (
                        <>
                          <span className="inline-flex items-center gap-1">
                            <span className={`font-semibold text-transparent bg-clip-text bg-gradient-to-r ${userColor.gradient}`}>
                              {displayName}
                            </span>
                            <span className="text-white/60">
                              {msg.message.includes("joined") ? (
                                <span className="inline-flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                                  {t("joined")}
                                </span>
                              ) : msg.message.includes("left") ? (
                                <span className="inline-flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 bg-red-400 rounded-full"></span>
                                  {t("left")}
                                </span>
                              ) : (
                                ""
                              )}
                            </span>
                          </span>
                        </>
                      ) : isHostControlMessage ? (
                        <span className="text-white/80">{displayMessage}</span>
                      ) : (
                        <>
                          <span className={`font-semibold text-transparent bg-clip-text bg-gradient-to-r ${userColor.gradient}`}>
                            {displayName}
                          </span>{" "}
                          <span className="text-white/60">{msg.message}</span>
                        </>
                      )}
                    </span>
                  </div>
                  <span className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 text-gray-500/60 text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                    {formatChatTime(msg.timestamp)}
                  </span>
                </div>
              </div>
            );
          }

          const onlyEmojis = isOnlyEmojis(msg.message);
          let displayUserName = userName;

          if (isCurrentUser) {
            const currentUsername = user?.username || user?.name || "";
            if (currentUsername) displayUserName = currentUsername;
          }

          if ((!displayUserName || displayUserName === "Unknown User") && msg.userEmail) {
            const emailUsername = msg.userEmail.split("@")[0];
            if (emailUsername) displayUserName = emailUsername;
          }

          const userColor = getUserColor(displayUserName);
          const canPinMessage =
            msg.type === "user" &&
            msg.message.trim().length > 0 &&
            msg.message.trim().length <= PIN_MESSAGE_CHAR_LIMIT;
          const showPinAction =
            isHost && msg.type === "user" && msg.message.trim().length > 0;
          const isPinnedMessage = pinnedMessage?.id === msg.id;
          const hasActiveReactionPicker = activeReactionMessageId === msg.id;
          const hasActiveReactionDetails =
            activeReactionDetails?.messageId === msg.id;
          const pinButtonTitle = !canPinMessage
            ? t("pinMessageLengthError", { max: String(PIN_MESSAGE_CHAR_LIMIT) })
            : isPinnedMessage
              ? t("unpinMessage")
              : t("pinMessage");
          const selectedMessageReaction = getCurrentUserReaction(msg);

          return (
            <div
              key={msg.id || i}
              className={`relative flex items-start gap-2 md:gap-3 group ${
                hasActiveReactionPicker || hasActiveReactionDetails ? "z-30" : "z-0"
              } ${isGroupedMessage ? "mt-0" : "mt-1"}`}
            >
              <div className={`relative flex-shrink-0 ${isGroupedMessage ? "w-8 md:w-10" : ""}`}>
                {!isGroupedMessage && (
                  <div className="relative">
                    <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${userColor.bg} rounded-full blur-md opacity-0 group-hover:opacity-30 transition-opacity duration-300`}></div>

                    {msg.userProfile ? (
                      <>
                        <img
                          src={msg.userProfile}
                          alt={displayUserName}
                          className="relative w-8 h-8 md:w-10 md:h-10 rounded-full object-cover shadow-xl border-2 border-white/20 ring-2 ring-white/5"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = "none";
                            const fallback =
                              target.nextElementSibling as HTMLElement;
                            if (fallback) fallback.style.display = "flex";
                          }}
                        />
                        <div
                          className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-white text-xs md:text-sm font-bold shadow-xl bg-gradient-to-br ${userColor.bg} border-2 border-white/20 hidden`}
                        >
                          {displayUserName.charAt(0).toUpperCase()}
                        </div>
                      </>
                    ) : (
                      <div
                        className={`relative w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-white text-xs md:text-sm font-bold shadow-xl bg-gradient-to-br ${userColor.bg} border-2 border-white/20 ring-2 ring-white/5`}
                      >
                        {displayUserName.charAt(0).toUpperCase()}
                      </div>
                    )}

                    {!isCurrentUser && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 md:w-3.5 md:h-3.5 bg-green-500 border-2 border-[#18181b] rounded-full shadow-lg">
                        <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-75"></div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0 flex flex-col gap-1 md:gap-1.5 items-start">
                {!isGroupedMessage && (
                  <div className="flex items-baseline gap-1.5 md:gap-2 min-w-0 w-full">
                    <span
                      className={`font-semibold text-xs md:text-sm text-transparent bg-clip-text bg-gradient-to-r ${userColor.gradient} tracking-tight truncate max-w-[120px] md:max-w-[180px]`}
                      title={displayUserName}
                    >
                      {displayUserName}
                    </span>
                  </div>
                )}

                {onlyEmojis ? (
                  <div
                    ref={(element) => {
                      messageBubbleRefs.current[msg.id] = element;
                    }}
                    className={`relative isolate group/message inline-flex max-w-full flex-col ${
                      isGroupedMessage ? "p-0.5 mt-0" : "p-0.5"
                    }`}
                  >
                    {renderMessageBubbleActions({
                      message: msg,
                      showPinAction,
                      canPinMessage,
                      isPinnedMessage,
                      pinButtonTitle,
                    })}
                    {activeReactionMessageId === msg.id && (
                      <MessageReactionPicker
                        placement={activeReactionPlacement}
                        selectedEmoji={selectedMessageReaction}
                        onSelect={(emoji) => handleMessageReactionSelect(msg.id, emoji)}
                      />
                    )}

                    <div className="relative z-0 inline-block">
                      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${userColor.bg} rounded-lg blur-xl opacity-20`}></div>
                      <p className={`relative text-3xl md:text-4xl leading-tight filter`}>
                        {msg.message}
                      </p>
                    </div>
                    {renderMessageReactionChips(msg)}
                    <span className="pointer-events-none absolute -bottom-4 right-0 text-gray-500/60 text-[9px] md:text-[10px] font-medium opacity-60 group-hover/message:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                      {formatChatTime(msg.timestamp)}
                    </span>
                  </div>
                ) : (
                  <div
                    ref={(element) => {
                      messageBubbleRefs.current[msg.id] = element;
                    }}
                    className="relative isolate group/message inline-flex max-w-full flex-col"
                  >
                    {renderMessageBubbleActions({
                      message: msg,
                      showPinAction,
                      canPinMessage,
                      isPinnedMessage,
                      pinButtonTitle,
                    })}
                    {activeReactionMessageId === msg.id && (
                      <MessageReactionPicker
                        placement={activeReactionPlacement}
                        selectedEmoji={selectedMessageReaction}
                        onSelect={(emoji) => handleMessageReactionSelect(msg.id, emoji)}
                      />
                    )}

                    <div className={`pointer-events-none absolute -inset-0.5 bg-gradient-to-br ${userColor.bg} rounded-xl md:rounded-2xl blur opacity-0 group-hover/message:opacity-20 transition-opacity duration-300`}></div>

                    <div
                      className={`relative px-2.5 md:px-3 py-2 md:py-2.5 transition-all duration-200 backdrop-blur-xl ${isGroupedMessage
                          ? "rounded-lg md:rounded-xl mt-0"
                          : isCurrentUser
                            ? "rounded-xl md:rounded-2xl rounded-tl-sm"
                            : "rounded-xl md:rounded-2xl rounded-tl-sm"
                        } ${isCurrentUser
                          ? `bg-gradient-to-br from-purple-600/15 via-pink-600/10 to-fuchsia-600/10 `
                          : "bg-gradient-to-br from-zinc-800/15 via-zinc-700/15 to-zinc-800/15 "
                        }`}
                    >
                      <p className="text-white/95 text-xs md:text-sm leading-relaxed break-words whitespace-pre-wrap font-medium">
                        {msg.message}
                      </p>
                      <div className="w-full text-right text-white/50 text-[9px] md:text-[10px] font-medium opacity-60 group-hover/message:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
                        {formatChatTime(msg.timestamp)}
                      </div>
                    </div>
                    {renderMessageReactionChips(msg)}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {typingDisplayNames.length > 0 && (
          <div className="flex items-center gap-2 md:gap-2.5 px-2 md:px-3 py-1.5 md:py-2">
            <div className="relative flex items-center gap-0.5 md:gap-1">
              <div className="w-1 h-1 md:w-1.5 md:h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "0s" }}></div>
              <div className="w-1 h-1 md:w-1.5 md:h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
              <div className="w-1 h-1 md:w-1.5 md:h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
            </div>
            <div className="flex items-center gap-1 md:gap-1.5 px-2 md:px-3 py-1 md:py-1.5 bg-gradient-to-br from-zinc-800/15 via-zinc-700/15 to-zinc-800/15 backdrop-blur-xl border border-cyan-500/20 rounded-lg">
              <span className="text-cyan-300 text-[10px] md:text-xs font-medium">
                <span className="font-semibold">
                  {typingDisplayNames.join(", ")}
                </span>
                <span className="text-cyan-400/70 ml-1 md:ml-1.5">
                  {typingDisplayNames.length === 1 ? t("isTyping") : t("areTyping")}
                </span>
              </span>
            </div>
          </div>
        )}

      </div>

      {/* Reaction Buttons - Collapsible with reduced spacing */}
      <div className={`transition-all duration-300 ease-in-out overflow-hidden ${showReactions ? 'max-h-16 opacity-100 mb-0 md:mb-1' : 'max-h-0 opacity-0 mb-0'
        }`}>
        <div className="relative flex items-center justify-center gap-2 md:gap-3 pb-1 md:pb-2">
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

                setTimeout(() => {
                  setAnimatingReaction(null);
                }, 600);
              }}
            />
          ))}

          <div className="w-px h-6 md:h-8 bg-gradient-to-b from-transparent via-white/20 to-transparent" />

          <div className="relative">
            <ReactionPicker
              pinnedReactions={pinnedReactions}
              onReactionsChange={handleReactionsChange}
            />
          </div>
        </div>
      </div>

      {/* Input Area */}
      <div className="relative flex items-center gap-1 bg-gradient-to-br from-zinc-800/15 via-zinc-700/15 to-zinc-800/15 backdrop-blur-xl border border-zinc-600/15 rounded-xl md:rounded-2xl px-2.5 md:px-3 py-1 md:py-1.5 shadow-2xl overflow-visible">
        {showEmojis && (
          <div
            ref={emojiPickerRef}
            className="absolute bottom-full left-0 right-0 mb-2 rounded-xl md:rounded-2xl animate-slide-up z-[100] overflow-hidden emoji-picker-container"
            style={{ minWidth: "100%" }}
          >
            <EmojiPicker
              onEmojiClick={handleEmojiClick}
              theme={"dark" as Theme}
              searchPlaceHolder={t("searchEmojis")}
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
        {isMobile ? (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="text"
            placeholder={isJoined ? t("sendMessage") : t("connecting")}
            value={messageInput}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            disabled={!isJoined || isLoading}
            enterKeyHint="send"
            className="flex-1 bg-transparent outline-none text-white/95 text-base placeholder:text-white/40 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          />
        ) : (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            placeholder={isJoined ? t("sendMessage") : t("connecting")}
            value={messageInput}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            disabled={!isJoined || isLoading}
            rows={1}
            className="flex-1 bg-transparent outline-none text-white/95 text-xs md:text-sm placeholder:text-white/40 disabled:opacity-50 disabled:cursor-not-allowed resize-none overflow-y-auto max-h-[240px] font-medium break-all"
            style={{
              minHeight: "20px",
              maxHeight: "240px",
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = "20px";
              target.style.height = Math.min(target.scrollHeight, 240) + "px";
            }}
          />
        )}

        {/* Reaction Toggle Button - Show only when input is empty */}
        {!messageInput.trim() && (
          <button
            onClick={() => setShowReactions(!showReactions)}
            className={`relative p-1.5 md:p-2 rounded-lg md:rounded-xl transition-all duration-200 group ${showReactions
              ? "text-rose-400"
              : "text-white/50 hover:text-rose-400"
              }`}
            title={showReactions ? t("hideReactions") : t("showReactions")}
          >

            {showReactions ? (
              <MdOutlineCelebration
                size={16}
                className={`relative md:w-[18px] md:h-[18px]`}
              />
            ) : (
              <MdCelebration
                size={16}
                className={`relative md:w-[18px] md:h-[18px]`}
              />
            )}
          </button>
        )}

        <button
          data-emoji-button
          onClick={() => setShowEmojis(!showEmojis)}
          className={`relative p-1.5 md:p-2 rounded-lg md:rounded-xl transition-all duration-200 group ${showEmojis
            ? "text-pink-400"
            : "text-white/70 hover:text-pink-400"
            }`}
        >
          <div className={`absolute inset-0 rounded-lg md:rounded-xl transition-all duration-200 ${showEmojis
            ? "bg-gradient-to-br from-purple-600/20 via-pink-600/20 to-fuchsia-600/20"
            : "bg-gradient-to-br from-zinc-800/10 via-zinc-700/10 to-zinc-800/10 opacity-0 group-hover:opacity-100"
            }`}></div>
          <LuSmile size={18} className="relative md:w-5 md:h-5" />
        </button>

        {/* Send Button - Show only when input has text */}
        {messageInput.trim() && (
          <button
            onClick={handleSendMessage}
            disabled={!isJoined || isLoading}
            className="relative p-1.5 md:p-2 rounded-lg md:rounded-xl text-white/70 hover:text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-pink-600/20 to-fuchsia-600/20 rounded-lg md:rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <LuArrowUp size={18} className="relative md:w-5 md:h-5" />
          </button>
        )}
      </div>

      <style jsx global>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }

        .epr-skin-tones {
          margin-right: 8px !important;
          margin-left: 10px !important;
          border-radius: 10px !important;
        }

        .epr-skin-tone-select {
          margin-left: 8px !important;
          margin-right: 8px !important;
        }

        @media (max-width: 639px) {
          .emoji-picker-container {
            min-width: 100% !important;
            max-width: 100% !important;
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

        @media (min-width: 1536px) {
        }
      `}</style>
    </div>
  );
};

export default ChatTab;
