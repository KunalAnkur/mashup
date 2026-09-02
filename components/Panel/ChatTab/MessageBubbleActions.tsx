import { LuSmile, LuPin } from "react-icons/lu";
import { ChatMessage } from "@/types/chatTypes";
import { MessageActionPlacement } from "./types";
import { chatMessageActionsBubbleClass } from "./styles";

interface MessageBubbleActionsProps {
  message: ChatMessage;
  actionPlacement: MessageActionPlacement;
  showPinAction: boolean;
  canPinMessage: boolean;
  isPinnedMessage: boolean;
  pinButtonTitle: string;
  isJoined: boolean;
  pinActionLoadingId: string | null;
  /** Mobile: the bar is hidden until the message is tapped. Desktop still uses hover. */
  revealed: boolean;
  onReactionPickerToggle: (messageId: string) => void;
  onPinMessage: (message: ChatMessage) => void;
  t: (key: string) => string;
}

export const MessageBubbleActions = ({
  message,
  actionPlacement,
  showPinAction,
  canPinMessage,
  isPinnedMessage,
  pinButtonTitle,
  isJoined,
  pinActionLoadingId,
  revealed,
  onReactionPickerToggle,
  onPinMessage,
  t,
}: MessageBubbleActionsProps) => {
  const visibilityClass = revealed
    ? "opacity-100 pointer-events-auto"
    : "opacity-0 pointer-events-none md:group-hover/message:opacity-100 md:group-hover/message:pointer-events-auto md:group-focus-within/message:opacity-100 md:group-focus-within/message:pointer-events-auto";

  return (
    <div
      className={`pointer-events-none absolute z-20 flex items-center gap-0.5 ${
        actionPlacement === "top"
          ? "right-1.5 top-0 -translate-y-[42%]"
          : "left-full top-1/2 ml-1 -translate-y-1/2"
      }`}
    >
      <div className={`${chatMessageActionsBubbleClass} ${visibilityClass}`}>
        <button
          type="button"
          onClick={() => onReactionPickerToggle(message.id)}
          disabled={!isJoined}
          className="flex h-6.5 w-6.5 items-center justify-center rounded-full text-white/70 transition-colors duration-150 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          title={t("reactToMessage")}
        >
          <LuSmile size={11} />
        </button>
        {showPinAction && (
          <button
            type="button"
            onClick={() => canPinMessage && onPinMessage(message)}
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

// Made with Bob
