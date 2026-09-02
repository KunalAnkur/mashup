import { LuPin, LuX } from "react-icons/lu";
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
    <div className="relative flex items-start gap-2.5 overflow-hidden rounded-lg md:rounded-xl border border-white/[0.07] bg-white/[0.04] px-3 py-2 md:px-3.5 md:py-2.5">
      <LuPin
        size={13}
        className="mt-[3px] shrink-0 rotate-[18deg] text-amber-300/70"
      />

      <div className="min-w-0 flex-1">
        <div className="text-[9px] font-semibold uppercase tracking-[0.14em] text-amber-300/60">
          {t("pinnedMessage")}
        </div>
        <p className="mt-0.5 text-[11px] md:text-xs leading-snug text-white/85">
          <span className="font-medium text-white/90">
            {pinnedMessage.userName}:
          </span>
          <span style={{ overflowWrap: "anywhere" }}> {pinnedMessage.message}</span>
        </p>
      </div>

      {isHost && (
        <button
          onClick={onUnpin}
          disabled={pinActionLoadingId === pinnedMessage.id}
          className="-mr-1 -mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white/40 transition-colors duration-200 hover:bg-white/[0.06] hover:text-white/80 disabled:cursor-not-allowed disabled:opacity-50"
          title={t("unpinMessage")}
        >
          <LuX size={13} />
        </button>
      )}
    </div>
  );
};
