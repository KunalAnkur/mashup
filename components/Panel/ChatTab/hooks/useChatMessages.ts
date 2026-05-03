import { useMemo } from "react";
import { ChatMessage } from "@/types/chatTypes";
import { RootState } from "@/lib/store";
import { useSelector } from "react-redux";

export const useChatMessages = (messages: ChatMessage[]) => {
  const user = useSelector((state: RootState) => state.auth.user);

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
      const isGenericName = (name: string) => {
        if (!name) return true;
        const genericPatterns = /^(user|guest|anonymous)/i;
        return genericPatterns.test(name);
      };
      if (!isGenericName(message.userName)) {
        nameByUserId.set(message.userId, message.userName);
      }
    }
    return nameByUserId;
  }, [messages]);

  return {
    isCurrentUserMessage,
    isSameUser,
    latestMessageNameByUserId,
  };
};

// Made with Bob
