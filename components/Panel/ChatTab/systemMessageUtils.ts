import { ChatMessage } from "@/types/chatTypes";

interface User {
  username?: string;
  name?: string;
  email?: string;
}

export const getSystemMessageDisplayName = (
  message: ChatMessage,
  isCurrentUser: boolean,
  user: User | null
): string => {
  let displayName = message.userName || "Unknown User";

  if (isCurrentUser && user) {
    const currentUsername = user.username || user.name || "";
    if (currentUsername) displayName = currentUsername;
  }

  if ((!displayName || displayName === "Unknown User") && message.userEmail) {
    const emailUsername = message.userEmail.split("@")[0];
    if (emailUsername) displayName = emailUsername;
  }

  if (!displayName || displayName === "Unknown User") {
    displayName = message.message
      .replace(" joined the chat", "")
      .replace(" left the chat", "")
      .trim();
  }

  displayName = displayName.replace(/^Unknown User\s+/i, "");
  return displayName;
};

export const translateSystemMessage = (
  message: ChatMessage,
  isCurrentUser: boolean,
  user: User | null,
  t: (key: string) => string,
  tCommon: (key: string) => string
): string => {
  let displayMessage = message.message;
  
  const isHostControlMessage =
    message.message.includes("started") ||
    message.message.includes("paused") ||
    message.message.includes("resumed") ||
    message.message.includes("seeked");

  if (!isHostControlMessage || !user) {
    return displayMessage;
  }

  const messageWords = displayMessage.split(" ");
  const firstWord = messageWords[0] || "";

  const currentUserName = (user.username || user.name || "").trim().toLowerCase();
  const currentUserEmail = (user.email || "").trim().toLowerCase();
  const emailUsername = currentUserEmail ? currentUserEmail.split("@")[0].toLowerCase() : "";
  const messageUserName = (message.userName || "").trim().toLowerCase();
  const messageUserEmail = (message.userEmail || "").trim().toLowerCase();
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
      messageWords[0] = tCommon("you");
      displayMessage = messageWords.join(" ");
    }
  } else {
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

  return displayMessage;
};

export const isJoinLeaveMessage = (message: ChatMessage): boolean => {
  return message.message.includes("joined") || message.message.includes("left");
};

export const isHostControlMessage = (message: ChatMessage): boolean => {
  return (
    message.message.includes("started") ||
    message.message.includes("paused") ||
    message.message.includes("resumed") ||
    message.message.includes("seeked")
  );
};

// Made with Bob
