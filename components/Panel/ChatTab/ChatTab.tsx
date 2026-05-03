"use client";

import { useState, useRef, useEffect, useLayoutEffect, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import { useSelector } from "react-redux";
import { isMobile } from "react-device-detect";
import type { EmojiClickData, Theme } from "emoji-picker-react";

import { useChatContext } from "@/context/ChatContext";
import { useRoomContext } from "@/context/RoomContext";
import { useSocket } from "@/context/SocketContext";
import { RootState } from "@/lib/store";
import { ChatMessage, ReactionType } from "@/types/chatTypes";
import { showError } from "@/utils/toast";
import { useTranslations } from "@/i18n/I18nProvider";
import { getEmailPrefix, isGenericName } from "@/utils/chatName";

import { SystemMessage } from "./SystemMessage";
import { UserMessage } from "./UserMessage";
import { StatusBanner } from "./StatusBanner";
import { PinnedMessageBanner } from "./PinnedMessageBanner";
import { TypingIndicator } from "./TypingIndicator";
import { EmptyState } from "./EmptyState";
import { ChatInput } from "./ChatInput";
import { ReactionBar } from "./ReactionBar";

import { useChatMessages } from "./hooks/useChatMessages";
import { useMessagePlacement } from "./hooks/useMessagePlacement";
import { getUserColor, getCurrentUserReaction, getReactionOwnerKey, isNearBottom } from "./utils";
import {
  getSystemMessageDisplayName,
  translateSystemMessage,
  isJoinLeaveMessage,
  isHostControlMessage,
} from "./systemMessageUtils";
import {
  PIN_MESSAGE_CHAR_LIMIT,
  MAX_TEXTAREA_LINES,
  AUTO_SCROLL_THRESHOLD,
  DEFAULT_REACTIONS,
  MESSAGE_REACTION_DETAILS_APPROX_WIDTH,
  MESSAGE_REACTION_DETAILS_VIEWPORT_PADDING,
} from "./constants";
import { MessageReactionPlacement, ActiveReactionDetails, MessageActionPlacement } from "./types";

const EmojiPicker = dynamic(() => import("emoji-picker-react"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center p-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
    </div>
  ),
});

const ChatTab = () => {
  // State
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
  const [pinActionLoadingId, setPinActionLoadingId] = useState<string | null>(null);
  const [pinnedReactions, setPinnedReactions] = useState<ReactionType[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("pinnedReactions");
      return saved ? JSON.parse(saved) : DEFAULT_REACTIONS;
    }
    return DEFAULT_REACTIONS;
  });
  const [animatingReaction, setAnimatingReaction] = useState<ReactionType | null>(null);

  // Refs
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const lastMessageCountRef = useRef(0);
  const shouldAutoScrollRef = useRef(true);
  const messageBubbleRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  // Context and hooks
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

  const { isCurrentUserMessage, isSameUser, latestMessageNameByUserId } = useChatMessages(messages);
  const { updateMessageReactionPlacement } = useMessagePlacement(
    messages,
    messageBubbleRefs,
    messagesContainerRef,
    setMessageActionPlacements,
    setActiveReactionPlacement
  );

  const currentReactionOwnerKey = user?.email?.trim().toLowerCase() || socket?.id || "";

  // Save pinned reactions to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("pinnedReactions", JSON.stringify(pinnedReactions));
    }
  }, [pinnedReactions]);

  // Auto-scroll on new messages
  useLayoutEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    if (messages.length === lastMessageCountRef.current) return;
    lastMessageCountRef.current = messages.length;

    if (!shouldAutoScrollRef.current) return;

    container.scrollTop = container.scrollHeight;
  }, [messages.length]);

  // Handle scroll to track auto-scroll state
  const handleMessagesScroll = () => {
    const container = messagesContainerRef.current;
    if (!container) return;

    shouldAutoScrollRef.current = isNearBottom(container, AUTO_SCROLL_THRESHOLD);

    if (activeReactionMessageId) {
      setActiveReactionMessageId(null);
    }

    if (activeReactionDetails) {
      setActiveReactionDetails(null);
    }
  };

  // Handle click outside for emoji picker and reaction overlays
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

  // Handle viewport changes for reaction picker
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
  }, [activeReactionMessageId, updateMessageReactionPlacement]);

  // Handle viewport scroll for reaction overlays
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

  // Typing display names
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

  // Handlers
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
    if (!result.success) {
      setMessageInput(trimmedMessage);
      console.error("Failed to send message:", result.error);
      showError(tToast("failedToSendMessage"), result.error || tToast("checkConnection"));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      handleSendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = e.target.value;

    if (!isMobile) {
      const lines = value.split("\n");
      if (lines.length > MAX_TEXTAREA_LINES) {
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

  const handleTextareaInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement;
    target.style.height = "20px";
    target.style.height = Math.min(target.scrollHeight, 240) + "px";
  };

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

  const handleMessageReactionSelect = (messageId: string, emoji: ReactionType) => {
    toggleMessageReaction(messageId, emoji);
    setActiveReactionMessageId(null);
    setActiveReactionDetails(null);
  };

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
      if (current?.messageId === messageId && current.emoji === emoji) {
        return null;
      }

      return { messageId, emoji, popupAlign };
    });
  };

  const resolveReactionDetailsAlign = (triggerRect: DOMRect): "start" | "end" => {
    if (typeof window === "undefined") {
      return "start";
    }

    const requiredWidth =
      MESSAGE_REACTION_DETAILS_APPROX_WIDTH + MESSAGE_REACTION_DETAILS_VIEWPORT_PADDING;
    const availableRight =
      window.innerWidth - triggerRect.left - MESSAGE_REACTION_DETAILS_VIEWPORT_PADDING;
    const availableLeft = triggerRect.right - MESSAGE_REACTION_DETAILS_VIEWPORT_PADDING;

    if (availableRight >= requiredWidth) {
      return "start";
    }

    if (availableLeft >= requiredWidth) {
      return "end";
    }

    return availableRight >= availableLeft ? "start" : "end";
  };

  const handleReactionClick = (emoji: ReactionType) => {
    setAnimatingReaction(emoji);
    sendReaction(emoji);
    setTimeout(() => {
      setAnimatingReaction(null);
    }, 600);
  };

  const handleReactionsChange = (newReactions: ReactionType[]) => {
    setPinnedReactions(newReactions);
  };

  // Get user display name for user messages
  const getUserDisplayName = (msg: ChatMessage): string => {
    let displayUserName = msg.userName || "Unknown User";

    if (isCurrentUserMessage(msg)) {
      const currentUsername = user?.username || user?.name || "";
      if (currentUsername) displayUserName = currentUsername;
    }

    if ((!displayUserName || displayUserName === "Unknown User") && msg.userEmail) {
      const emailUsername = msg.userEmail.split("@")[0];
      if (emailUsername) displayUserName = emailUsername;
    }

    return displayUserName;
  };

  return (
    <div className="flex flex-col h-full w-full gap-2 md:gap-3 overflow-visible">
      {!isConnected && <StatusBanner type="connecting" message={t("connectingToChat")} />}
      {isLoading && <StatusBanner type="loading" message={t("joiningChatRoom")} />}
      {pinnedMessage && (
        <PinnedMessageBanner
          pinnedMessage={pinnedMessage}
          isHost={isHost}
          pinActionLoadingId={pinActionLoadingId}
          onUnpin={handleUnpinFromBanner}
          t={t}
        />
      )}

      <div
        ref={messagesContainerRef}
        onScroll={handleMessagesScroll}
        className="flex-1 flex flex-col gap-2 md:gap-3 overflow-y-auto pr-1 md:pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
      >
        {messages.length === 0 && isJoined && !isLoading && (
          <EmptyState message={t("noMessages")} />
        )}

        {messages.map((msg, i) => {
          if (!msg || !msg.message) return null;

          const isCurrentUser = isCurrentUserMessage(msg);
          const isSystemMessage = msg.type === "system";
          const prevMessage = i > 0 ? messages[i - 1] : null;
          const isGroupedMessage = !!(prevMessage && isSameUser(msg, prevMessage) && !isSystemMessage);

          if (isSystemMessage) {
            const displayName = getSystemMessageDisplayName(msg, isCurrentUser, user);
            const displayMessage = translateSystemMessage(msg, isCurrentUser, user, t, tCommon);

            return (
              <SystemMessage
                key={msg.id || i}
                message={msg}
                displayName={displayName}
                displayMessage={displayMessage}
                isJoinLeaveMessage={isJoinLeaveMessage(msg)}
                isHostControlMessage={isHostControlMessage(msg)}
                t={t}
              />
            );
          }

          const displayUserName = getUserDisplayName(msg);
          const userColor = getUserColor(displayUserName);
          const canPinMessage =
            msg.type === "user" &&
            msg.message.trim().length > 0 &&
            msg.message.trim().length <= PIN_MESSAGE_CHAR_LIMIT;
          const showPinAction = isHost && msg.type === "user" && msg.message.trim().length > 0;
          const isPinnedMessage = pinnedMessage?.id === msg.id;
          const hasActiveReactionPicker = activeReactionMessageId === msg.id;
          const hasActiveReactionDetails = activeReactionDetails?.messageId === msg.id;
          const pinButtonTitle = !canPinMessage
            ? t("pinMessageLengthError", { max: String(PIN_MESSAGE_CHAR_LIMIT) })
            : isPinnedMessage
              ? t("unpinMessage")
              : t("pinMessage");
          const selectedMessageReaction = getCurrentUserReaction(msg, currentReactionOwnerKey);

          return (
            <UserMessage
              key={msg.id || i}
              message={msg}
              displayUserName={displayUserName}
              userColor={userColor}
              isCurrentUser={isCurrentUser}
              isGroupedMessage={isGroupedMessage}
              showPinAction={showPinAction}
              canPinMessage={canPinMessage}
              isPinnedMessage={isPinnedMessage}
              pinButtonTitle={pinButtonTitle}
              hasActiveReactionPicker={hasActiveReactionPicker}
              hasActiveReactionDetails={hasActiveReactionDetails}
              selectedMessageReaction={selectedMessageReaction}
              activeReactionPlacement={activeReactionPlacement}
              activeReactionDetails={activeReactionDetails}
              messageActionPlacements={messageActionPlacements}
              isJoined={isJoined}
              pinActionLoadingId={pinActionLoadingId}
              currentReactionOwnerKey={currentReactionOwnerKey}
              onReactionPickerToggle={handleReactionPickerToggle}
              onPinMessage={handlePinFromMessage}
              onMessageReactionSelect={handleMessageReactionSelect}
              onReactionDetailsToggle={handleReactionDetailsToggle}
              resolveReactionDetailsAlign={resolveReactionDetailsAlign}
              messageBubbleRef={(element) => {
                messageBubbleRefs.current[msg.id] = element;
              }}
              t={t}
              tCommon={tCommon}
            />
          );
        })}

        <TypingIndicator typingDisplayNames={typingDisplayNames} t={t} />
      </div>

      <ReactionBar
        showReactions={showReactions}
        pinnedReactions={pinnedReactions}
        animatingReaction={animatingReaction}
        isJoined={isJoined}
        onReactionClick={handleReactionClick}
        onReactionsChange={handleReactionsChange}
      />

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
                "--epr-search-input-bg-color-active": "rgba(255, 255, 255, 0.1)",
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

      <ChatInput
        messageInput={messageInput}
        showEmojis={showEmojis}
        showReactions={showReactions}
        isJoined={isJoined}
        isLoading={isLoading}
        inputRef={inputRef}
        onInputChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onSendMessage={handleSendMessage}
        onToggleEmojis={() => setShowEmojis(!showEmojis)}
        onToggleReactions={() => setShowReactions(!showReactions)}
        onTextareaInput={handleTextareaInput}
        t={t}
      />

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

// Made with Bob
