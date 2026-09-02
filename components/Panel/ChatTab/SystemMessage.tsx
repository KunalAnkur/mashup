import {
  LuArrowRight,
  LuLogOut,
  LuPlay,
  LuPause,
  LuRotateCw,
  LuChevronsRight,
  LuInfo,
} from "react-icons/lu";
import { ChatMessage } from "@/types/chatTypes";
import { formatChatTime } from "@/utils/timeFormatter";
import { chatSystemMessageTimestampClass } from "./styles";
import { getUserColor } from "./utils";
import { getSystemMessageKind } from "./systemMessageUtils";

interface SystemMessageProps {
  message: ChatMessage;
  displayName: string;
  displayMessage: string;
  isJoinLeaveMessage: boolean;
  isHostControlMessage: boolean;
  t: (key: string) => string;
}

const KIND_ICON = {
  join: LuArrowRight,
  leave: LuLogOut,
  play: LuPlay,
  pause: LuPause,
  resume: LuRotateCw,
  seek: LuChevronsRight,
  generic: LuInfo,
} as const;

export const SystemMessage = ({
  message,
  displayName,
  displayMessage,
  isJoinLeaveMessage,
  isHostControlMessage,
  t,
}: SystemMessageProps) => {
  const userColor = getUserColor(displayName);
  const kind = getSystemMessageKind(message);
  const Icon = KIND_ICON[kind];

  // `displayMessage` for a host action is either a full self-sentence ("You paused the
  // video" / its per-locale translation, grammatically distinct — not just "You" + a shared
  // verb) or, for everyone else, the untouched name followed by the translated action
  // ("mrankur810 videoyu başlattı"). Only the second form actually starts with the name, so
  // this is a safe way to recolor it without re-deriving the split translation-by-translation.
  const hostControlNamePrefix =
    isHostControlMessage && displayMessage.startsWith(displayName)
      ? displayName
      : null;

  // Presence (join / leave) — the noisiest, least important lines. Keep them featherweight:
  // no pill, tiny type, just a directional glyph + the name.
  if (isJoinLeaveMessage) {
    const isJoin = kind === "join";
    return (
      <div className="flex justify-center py-0.5">
        <div className="group relative inline-flex items-center gap-1.5 text-[11px]">
          <Icon
            size={11}
            className={isJoin ? "text-emerald-400/60" : "text-white/25"}
          />
          <span className={`font-medium ${userColor.text}`}>{displayName}</span>
          <span className="text-white/35">{isJoin ? t("joined") : t("left")}</span>
          <span className={chatSystemMessageTimestampClass}>
            {formatChatTime(message.timestamp)}
          </span>
        </div>
      </div>
    );
  }

  // Host actions + anything else — a quiet centered pill with a matching icon. This is the
  // "announcement" tier: a beat more present than presence lines, still low-noise.
  return (
    <div className="flex justify-center py-1">
      <div className="group relative inline-flex max-w-[85%] items-center gap-1.5 rounded-full bg-white/[0.05] px-2.5 py-1">
        <Icon size={11} className="shrink-0 text-white/45" />
        <span className="text-[11px] md:text-xs leading-snug text-white/65">
          {isHostControlMessage ? (
            hostControlNamePrefix ? (
              <>
                <span className={`font-medium ${userColor.text}`}>
                  {hostControlNamePrefix}
                </span>
                {displayMessage.slice(hostControlNamePrefix.length)}
              </>
            ) : (
              displayMessage
            )
          ) : (
            <>
              <span className={`font-medium ${userColor.text}`}>{displayName}</span>{" "}
              {message.message}
            </>
          )}
        </span>
        <span className={chatSystemMessageTimestampClass}>
          {formatChatTime(message.timestamp)}
        </span>
      </div>
    </div>
  );
};
