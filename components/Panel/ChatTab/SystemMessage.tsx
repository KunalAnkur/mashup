import { ChatMessage } from "@/types/chatTypes";
import { formatChatTime } from "@/utils/timeFormatter";
import { zincGlassBorderedSurfaceClass } from "@/components/UI/classTokens";
import { chatSystemMessageTimestampClass } from "./styles";
import { getUserColor } from "./utils";

interface SystemMessageProps {
  message: ChatMessage;
  displayName: string;
  displayMessage: string;
  isJoinLeaveMessage: boolean;
  isHostControlMessage: boolean;
  t: (key: string) => string;
}

export const SystemMessage = ({
  message,
  displayName,
  displayMessage,
  isJoinLeaveMessage,
  isHostControlMessage,
  t,
}: SystemMessageProps) => {
  const userColor = getUserColor(displayName);

  return (
    <div className="flex justify-center py-1">
      <div className="relative group">
        <div className={`relative rounded-full px-4 py-1.5 ${zincGlassBorderedSurfaceClass}`}>
          <span className="text-white/80 text-xs font-medium">
            {isJoinLeaveMessage ? (
              <span className="inline-flex items-center gap-1">
                <span className={`font-semibold text-transparent bg-clip-text bg-gradient-to-r ${userColor.gradient}`}>
                  {displayName}
                </span>
                <span className="text-white/60">
                  {message.message.includes("joined") ? (
                    <span className="inline-flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                      {t("joined")}
                    </span>
                  ) : message.message.includes("left") ? (
                    <span className="inline-flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-red-400 rounded-full"></span>
                      {t("left")}
                    </span>
                  ) : (
                    ""
                  )}
                </span>
              </span>
            ) : isHostControlMessage ? (
              <span className="text-white/80">{displayMessage}</span>
            ) : (
              <>
                <span className={`font-semibold text-transparent bg-clip-text bg-gradient-to-r ${userColor.gradient}`}>
                  {displayName}
                </span>{" "}
                <span className="text-white/60">{message.message}</span>
              </>
            )}
          </span>
        </div>
        <span className={chatSystemMessageTimestampClass}>
          {formatChatTime(message.timestamp)}
        </span>
      </div>
    </div>
  );
};

// Made with Bob
