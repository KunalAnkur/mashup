"use client";
import { useEffect, useState } from "react";
import { LuClock, LuSparkles } from "react-icons/lu";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import { useTranslations } from "@/i18n/I18nProvider";
import { trackUpgradeModalShown, trackUpgradeClicked } from "@/lib/analytics";
import {
  Modal,
  ModalHeader,
  modalAccentIconWrapClass,
  modalAccentTitleClass,
  modalBrandActionButtonClass,
  modalConfirmSurfaceClass,
  modalBalancedContentClass,
  modalDiscardActionButtonClass,
  modalSubtleCloseButtonClass,
} from "@/components/UI";

interface PlaybackBlockedModalProps {
  isOpen: boolean;
  limit: number;
  planName: string;
}

/**
 * Shown when a room's daily watch allowance runs out. The allowance belongs to the host
 * (MOVMASH.md §4.2), so the two roles need different treatment:
 *
 * - **Host** — they can actually fix this. Non-dismissable with an upgrade CTA, because
 *   playback is genuinely blocked for the rest of the day.
 * - **Everyone else** — upgrading their own account would not unblock the room, so offering
 *   them an upgrade button would take money for nothing. They get an explanation they can
 *   dismiss; the player stays blocked regardless of this modal.
 */
const PlaybackBlockedModal = ({ isOpen, limit, planName }: PlaybackBlockedModalProps) => {
  const t = useTranslations("room");
  const router = useRouter();
  const roomId = useSelector((state: RootState) => state.room.roomId);
  const isHost = useSelector((state: RootState) => state.room.host);
  const [dismissed, setDismissed] = useState(false);

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

  const handleUpgradeClick = () => {
    trackUpgradeClicked("daily_limit", roomId);
    // Guest hosts (rooms created before hosting required an account) land on /pricing and
    // are prompted to sign in by the checkout button there, so no special case is needed.
    router.push("/pricing");
  };

  return (
    <Modal
      open={isOpen && !dismissed}
      onClose={() => setDismissed(true)}
      closeOnBackdropClick={!isHost}
      closeOnEscape={!isHost}
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
          title={isHost ? t("watchLimit.title") : t("watchLimit.viewerTitle")}
          titleClassName={`${modalAccentTitleClass} text-base md:text-lg`}
          onClose={isHost ? undefined : () => setDismissed(true)}
          closeButtonClassName={modalSubtleCloseButtonClass}
        />

        <div className={modalBalancedContentClass}>
          <p className="mb-4 text-xs leading-relaxed text-white/70 md:mb-5 md:text-sm">
            {isHost
              ? t("watchLimit.message", { limit, planName })
              : t("watchLimit.viewerMessage", { limit })}
          </p>

          {isHost ? (
            <button
              onClick={handleUpgradeClick}
              className={`${modalBrandActionButtonClass} flex w-full items-center justify-center gap-1.5 font-semibold`}
            >
              <LuSparkles size={16} />
              <span>{t("watchLimit.upgradeCta")}</span>
            </button>
          ) : (
            <button
              onClick={() => setDismissed(true)}
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
