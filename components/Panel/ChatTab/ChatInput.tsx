import { LuArrowUp, LuSmile } from "react-icons/lu";
import { MdCelebration, MdOutlineCelebration } from "react-icons/md";
import { isMobile } from "react-device-detect";
import { Input } from "@/components/UI";
import { chatComposerIconButtonClass, chatInputFieldBaseClass } from "./styles";

interface ChatInputProps {
  messageInput: string;
  showEmojis: boolean;
  showReactions: boolean;
  isJoined: boolean;
  isLoading: boolean;
  inputRef: React.RefObject<HTMLInputElement | HTMLTextAreaElement>;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onSendMessage: () => void;
  onToggleEmojis: () => void;
  onToggleReactions: () => void;
  onTextareaInput: (e: React.FormEvent<HTMLTextAreaElement>) => void;
  t: (key: string) => string;
}

export const ChatInput = ({
  messageInput,
  showEmojis,
  showReactions,
  isJoined,
  isLoading,
  inputRef,
  onInputChange,
  onKeyDown,
  onSendMessage,
  onToggleEmojis,
  onToggleReactions,
  onTextareaInput,
  t,
}: ChatInputProps) => {
  return (
    <div className="relative flex items-center gap-1 overflow-visible rounded-xl px-2.5 py-1 md:rounded-2xl md:px-3 md:py-1.5 bg-white/[0.05] border border-white/[0.07] transition-colors duration-200 focus-within:border-white/15 focus-within:bg-white/[0.07]">
      {isMobile ? (
        <Input
          variant="raw"
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type="text"
          placeholder={isJoined ? t("sendMessage") : t("connecting")}
          value={messageInput}
          onChange={onInputChange}
          onKeyDown={onKeyDown}
          disabled={!isJoined || isLoading}
          enterKeyHint="send"
          className={chatInputFieldBaseClass}
        />
      ) : (
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          placeholder={isJoined ? t("sendMessage") : t("connecting")}
          value={messageInput}
          onChange={onInputChange}
          onKeyDown={onKeyDown}
          disabled={!isJoined || isLoading}
          rows={1}
          className={`${chatInputFieldBaseClass} resize-none overflow-y-auto max-h-[240px] break-all`}
          style={{
            minHeight: "20px",
            maxHeight: "240px",
          }}
          onInput={onTextareaInput}
        />
      )}

      {/* Reaction Toggle Button - Show only when input is empty */}
      {!messageInput.trim() && (
        <button
          onClick={onToggleReactions}
          className={`${chatComposerIconButtonClass} ${showReactions
            ? "text-rose-300/90 hover:text-rose-300"
            : "text-white/40 hover:text-white/70"
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
        onClick={onToggleEmojis}
        className={`${chatComposerIconButtonClass} ${showEmojis
          ? "text-white/90"
          : "text-white/45 hover:text-white/75"
          }`}
      >
        <LuSmile size={18} className="relative md:w-5 md:h-5" />
      </button>

      {/* Send Button - Show only when input has text */}
      {messageInput.trim() && (
        <button
          onClick={onSendMessage}
          disabled={!isJoined || isLoading}
          className={`${chatComposerIconButtonClass} bg-white/10 text-white hover:bg-white/15 disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <LuArrowUp size={18} className="relative md:w-5 md:h-5" />
        </button>
      )}
    </div>
  );
};

// Made with Bob
