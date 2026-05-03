import { LuArrowUp, LuSmile } from "react-icons/lu";
import { MdCelebration, MdOutlineCelebration } from "react-icons/md";
import { isMobile } from "react-device-detect";
import { Input } from "@/components/UI";
import { zincGlassBorderedSurfaceClass } from "@/components/UI/classTokens";
import { chatComposerIconButtonClass, chatComposerAccentOverlayClass, chatInputFieldBaseClass } from "./styles";

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
    <div className={`relative flex items-center gap-1 overflow-visible rounded-xl px-2.5 py-1 md:rounded-2xl md:px-3 md:py-1.5 ${zincGlassBorderedSurfaceClass}`}>
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
        onClick={onToggleEmojis}
        className={`${chatComposerIconButtonClass} ${showEmojis
          ? "text-pink-400"
          : "text-white/70 hover:text-pink-400"
          }`}
      >
        <div className={`${chatComposerAccentOverlayClass} ${showEmojis
          ? "bg-gradient-to-br from-purple-600/20 via-pink-600/20 to-fuchsia-600/20"
          : "bg-gradient-to-br from-zinc-800/10 via-zinc-700/10 to-zinc-800/10 opacity-0 group-hover:opacity-100"
          }`}></div>
        <LuSmile size={18} className="relative md:w-5 md:h-5" />
      </button>

      {/* Send Button - Show only when input has text */}
      {messageInput.trim() && (
        <button
          onClick={onSendMessage}
          disabled={!isJoined || isLoading}
          className={`${chatComposerIconButtonClass} text-white/70 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <div className={`${chatComposerAccentOverlayClass} bg-gradient-to-br from-purple-600/20 via-pink-600/20 to-fuchsia-600/20 opacity-0 group-hover:opacity-100`}></div>
          <LuArrowUp size={18} className="relative md:w-5 md:h-5" />
        </button>
      )}
    </div>
  );
};

// Made with Bob
