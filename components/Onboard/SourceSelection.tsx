"use client";

import {
  LuMonitor,
  LuFileUp,
  LuLink2,
  LuYoutube,
  LuArrowUpRight,
  LuArrowRight,
  LuKeyRound,
} from "react-icons/lu";
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { ImSpinner2 } from "react-icons/im";
import { trackCTAClicked } from "@/lib/analytics";
import { useTranslations } from "@/i18n/I18nProvider";
import { useJoinRoom, useScreenShareSupport } from "@/hooks";
import { ROOM_CODE_LENGTH } from "@/utils/validation";
import { Input } from "../UI";
import {
  dashActionArrowClass,
  dashActionIconClass,
  dashActionLabelClass,
  dashActionTileClass,
  dashActionTileGlowClass,
  dashActionsGridClass,
  dashJoinOpenClass,
  dashJoinTileClass,
  dashJoinSubmitIconClass,
  dashJoinTileInputClass,
  dashJoinTileInputWrapClass,
  dashJoinMobileCellClass,
  dashSectionHeadClass,
  dashSectionHeadTitleClass,
} from "../UI/classTokens";

/**
 * One colour per action, so the row can be read by shape and colour before any of it is
 * read as words. Solid rather than tinted — a wash of the same violet four times over is
 * what the previous grid of identical tiles already was.
 *
 * Two values per action, not one. `gradient` fills the icon chip. `rgb` is the same hue as
 * a bare triplet, handed to the tile as the `--tile-rgb` custom property so its border,
 * hover glow, icon shadow and arrow can all be drawn in that colour from a single shared
 * class string (see dashActionTileClass) instead of four variants of every rule.
 *
 * The triplet is the gradient's lighter stop: it is used at low alpha over a near-black
 * surface, where the darker stop barely registers.
 */
const ACTION_THEMES: Record<string, { gradient: string; rgb: string }> = {
  screenShare: { gradient: "linear-gradient(145deg,#38bdf8,#0284c7)", rgb: "56 189 248" },
  fileShare: { gradient: "linear-gradient(145deg,#a78bfa,#7c3aed)", rgb: "167 139 250" },
  addUrl: { gradient: "linear-gradient(145deg,#f472b6,#db2777)", rgb: "244 114 182" },
  youtube: { gradient: "linear-gradient(145deg,#f87171,#dc2626)", rgb: "248 113 113" },
  join: { gradient: "linear-gradient(145deg,#34d399,#059669)", rgb: "52 211 153" },
};

const SourceSelection = () => {
  const t = useTranslations("home");
  const router = useRouter();
  const canScreenShare = useScreenShareSupport();

  /** The join cell shows its field only once asked — see dashJoinTileClass. */
  const [joinOpen, setJoinOpen] = useState(false);
  const {
    roomId,
    isJoining,
    joinError,
    isJoinDisabled,
    inputRef,
    handleRoomIdChange,
    handleJoinRoom,
    handleKeyDown,
  } = useJoinRoom();

  const handleOnScreenShareSelection = useCallback(() => {
    trackCTAClicked("stream");
    router.push("/stream/screen");
  }, [router]);

  const handleOnFileShareSelection = useCallback(() => {
    trackCTAClicked("stream");
    router.push("/stream");
  }, [router]);

  const handleOnURLSelection = useCallback(() => {
    trackCTAClicked("sync");
    router.push("/sync");
  }, [router]);

  const handleOnYouTubeSelection = useCallback(() => {
    trackCTAClicked("sync");
    router.push("/youtube");
  }, [router]);

  /**
   * The ways to start something, as data, so the row is one loop.
   *
   * Every one of these is a route and a single tap. Joining by code moved out to
   * JoinRoomCard in the home rail once it became clear that the one action needing a
   * keyboard did not belong in a row of shortcuts.
   *
   * Screen share drops out on mobile — the capture API it leads to does not exist there,
   * so the tile would only walk someone into a dead end.
   */
  const actions = [
    ...(canScreenShare
      ? [{ key: "screenShare", Icon: LuMonitor, onClick: handleOnScreenShareSelection }]
      : []),
    { key: "fileShare", Icon: LuFileUp, onClick: handleOnFileShareSelection },
    { key: "addUrl", Icon: LuLink2, onClick: handleOnURLSelection },
    { key: "youtube", Icon: LuYoutube, onClick: handleOnYouTubeSelection },
  ];

  return (
    <section>
      <div className={dashSectionHeadClass}>
        <h2 className={dashSectionHeadTitleClass}>{t("actionsTitle")}</h2>
      </div>

      <div className={dashActionsGridClass}>
        {actions.map(({ key, Icon, onClick }) => {
          const theme = ACTION_THEMES[key];

          return (
            <button
              key={key}
              onClick={onClick}
              className={dashActionTileClass}
              // Every coloured rule on this tile reads from here — see ACTION_THEMES.
              style={{ "--tile-rgb": theme.rgb } as React.CSSProperties}
            >
              <span className={dashActionTileGlowClass} />
              <span className={dashActionIconClass} style={{ background: theme.gradient }}>
                <Icon className="text-[16px]" />
              </span>
              <span className={dashActionLabelClass}>{t(key)}</span>
              <LuArrowUpRight className={dashActionArrowClass} />
            </button>
          );
        })}

        {/* Narrow screens only: above 1080px this is JoinRoomCard's job, in the rail.
            Rendered inside the grid rather than beside it so it sits in the flow of the
            row, as the fifth thing you can do rather than an afterthought below it. */}
        <div
          className={dashJoinMobileCellClass}
          style={{ "--tile-rgb": ACTION_THEMES.join.rgb } as React.CSSProperties}
        >
          {joinOpen ? (
            <div className={dashJoinOpenClass}>
              <div className={dashJoinTileInputWrapClass}>
                <Input
                  ref={inputRef}
                  variant="raw"
                  type="text"
                  placeholder={t("roomIdPlaceholder")}
                  value={roomId}
                  onChange={handleRoomIdChange}
                  onKeyDown={handleKeyDown}
                  // Closing on blur only when nothing was typed: closing on any blur would
                  // throw away a half-entered code the moment someone tabbed to the button.
                  onBlur={() => {
                    if (!roomId.trim()) setJoinOpen(false);
                  }}
                  disabled={isJoining}
                  maxLength={ROOM_CODE_LENGTH}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                  className={dashJoinTileInputClass}
                />
              </div>
              <button
                type="button"
                onClick={handleJoinRoom}
                disabled={isJoinDisabled || isJoining}
                aria-label={t("join")}
                className={dashJoinSubmitIconClass}
              >
                {isJoining ? (
                  <ImSpinner2 className="animate-spin text-[14px]" />
                ) : (
                  <LuArrowRight className="text-[15px]" />
                )}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setJoinOpen(true);
                // Focus after the swap, or the field does not exist yet to focus.
                requestAnimationFrame(() => inputRef.current?.focus());
              }}
              className={dashJoinTileClass}
            >
              <span className={dashActionTileGlowClass} />
              <span
                className={dashActionIconClass}
                style={{ background: ACTION_THEMES.join.gradient }}
              >
                <LuKeyRound className="text-[15px]" />
              </span>
              <span className={dashActionLabelClass}>{t("joinCardTitle")}</span>
              <LuArrowUpRight className={dashActionArrowClass} />
            </button>
          )}
        </div>
      </div>

      {joinError ? (
        <div className={`${dashJoinMobileCellClass} mt-3 flex items-center gap-2 rounded-2xl border border-red-400/20 bg-red-500/10 px-3 py-2.5`}>
          <svg className="h-4 w-4 shrink-0 text-red-400" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          <p className="text-xs text-red-200 sm:text-sm">{joinError}</p>
        </div>
      ) : null}
    </section>
  );
};

export default SourceSelection;
