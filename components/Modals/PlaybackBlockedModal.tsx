"use client";
import { useEffect, useMemo, useState } from "react";
import { LuClock } from "react-icons/lu";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import { useLocale, useTranslations } from "@/i18n/I18nProvider";
import { trackUpgradeModalShown } from "@/lib/analytics";
import { SubscriptionTier } from "@/types/subscriptionTypes";
import UpgradePlanOffer from "@/components/Modals/UpgradePlanOffer";
import {
  Modal,
  ModalHeader,
  modalAccentIconWrapClass,
  modalAccentTitleClass,
  modalConfirmSurfaceClass,
  modalBalancedContentClass,
  modalDiscardActionButtonClass,
  modalSubtleCloseButtonClass,
} from "@/components/UI";

interface PlaybackBlockedModalProps {
  isOpen: boolean;
  limit: number;
  /** Which allowance ran out, in the words the room was spending it on — a game room is
   *  told about play, not watch time. Same minutes either way. */
  variant?: "watch" | "play";
}

/**
 * The local time the daily allowance comes back. Guardian keys usage to the UTC calendar day
 * (`getUsageDateUTC`), so it resets at 00:00 UTC — 5:30 AM in India, late afternoon in
 * California — and "tomorrow" was wrong for half the world.
 */
function useResetTime(locale: string): string {
  return useMemo(() => {
    const now = new Date();
    const reset = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1),
    );
    try {
      return new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit" }).format(reset);
    } catch {
      return reset.toLocaleTimeString();
    }
  }, [locale]);
}

/**
 * Shown when a room's daily watch allowance runs out. The allowance belongs to the host
 * (MOVMASH.md §4.2), so the two roles need different treatment:
 *
 * - **Host** — they can actually fix this, so they get the plan that does, priced, with a
 *   button straight to its checkout. They can also step away from it: playback stays blocked
 *   whether or not this is open, the overlay keeps explaining why, and the panel's Upgrade
 *   button brings the offer back. Trapping them behind a single button left anyone not ready
 *   to pay one way out — closing the tab.
 * - **Everyone else** — upgrading their own account would not unblock the room, so offering
 *   them an upgrade button would take money for nothing. They get an explanation they can
 *   dismiss; the player stays blocked regardless of this modal.
 */
const PlaybackBlockedModal = ({ isOpen, limit, variant = "watch" }: PlaybackBlockedModalProps) => {
  const t = useTranslations("room");
  const locale = useLocale();
  const roomId = useSelector((state: RootState) => state.room.roomId);
  const isHost = useSelector((state: RootState) => state.room.host);
  const [dismissed, setDismissed] = useState(false);
  const resetTime = useResetTime(locale);
  const group = variant === "play" ? "playLimit" : "watchLimit";

  useEffect(() => {
    if (isOpen) {
      setDismissed(false);
      // Host only. A viewer sees the same modal, but with no upgrade button — counting that
      // as an upgrade prompt would both inflate the funnel by room size and record an offer
      // that was never made, understating click-through against it.
      if (isHost) {
        trackUpgradeModalShown("daily_limit", roomId);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const dismiss = () => setDismissed(true);

  return (
    <Modal
      open={isOpen && !dismissed}
      onClose={dismiss}
      closeOnBackdropClick={!isHost}
      closeOnEscape
      overlayClassName="playback-blocked-modal z-[99999]"
      panelClassName={`${modalConfirmSurfaceClass} max-w-md`}
    >
      <div className="w-full">
        <ModalHeader
          className="mb-4 px-0 pt-0 pb-0"
          icon={
            <div className={modalAccentIconWrapClass}>
              <LuClock size={18} />
            </div>
          }
          title={isHost ? t(`${group}.title`) : t(`${group}.viewerTitle`)}
          titleClassName={`${modalAccentTitleClass} text-base md:text-lg`}
          onClose={dismiss}
          closeButtonClassName={modalSubtleCloseButtonClass}
        />

        <div className={modalBalancedContentClass}>
          <p className="text-xs leading-relaxed text-white/70 md:text-sm">
            {isHost
              ? t(`${group}.message`, { limit })
              : t(`${group}.viewerMessage`, { limit })}
          </p>
          <p className="mb-4 mt-2 flex items-center gap-1.5 text-[11px] text-white/45 md:mb-5">
            <LuClock size={12} className="shrink-0" />
            {t("watchLimit.resetsAt", { time: resetTime })}
          </p>

          {isHost ? (
            <>
              <UpgradePlanOffer
                tier={SubscriptionTier.COUPLE}
                lead="watch_time"
                context="daily_limit"
                roomId={roomId}
              />
              <button
                onClick={dismiss}
                className="mt-1 w-full rounded-xl py-2 text-xs font-medium text-white/45 transition-colors hover:text-white/75"
              >
                {t("watchLimit.notNow")}
              </button>
            </>
          ) : (
            <button
              onClick={dismiss}
              className={`${modalDiscardActionButtonClass} w-full`}
            >
              {t("watchLimit.gotIt")}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default PlaybackBlockedModal;
