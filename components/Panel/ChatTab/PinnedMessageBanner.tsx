import { LuPin } from "react-icons/lu";
import { ChatMessage } from "@/types/chatTypes";

interface PinnedMessageBannerProps {
  pinnedMessage: ChatMessage;
  isHost: boolean;
  pinActionLoadingId: string | null;
  onUnpin: () => void;
  t: (key: string) => string;
}

export const PinnedMessageBanner = ({
  pinnedMessage,
  isHost,
  pinActionLoadingId,
  onUnpin,
  t,
}: PinnedMessageBannerProps) => {
  return (
    <div className="relative px-3 md:px-4 py-2 md:py-2.5 bg-gradient-to-r from-zinc-800/25 via-amber-300/10 to-zinc-800/25 backdrop-blur-xl border border-amber-200/20 rounded-lg md:rounded-xl overflow-hidden">
      <div className="flex items-start justify-between gap-2 md:gap-3">
        <p className="min-w-0 flex-1 text-[11px] md:text-xs text-white/90 leading-snug whitespace-pre-wrap">
          <span className="font-medium text-white/95 whitespace-nowrap">
            {pinnedMessage.userName}:
          </span>
          <span style={{ overflowWrap: "anywhere" }}> {pinnedMessage.message}</span>
        </p>

        <button
          onClick={isHost ? onUnpin : undefined}
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
  );
};

// Made with Bob
