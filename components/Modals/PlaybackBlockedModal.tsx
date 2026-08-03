"use client";
import { useEffect } from "react";
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
} from "@/components/UI";

interface PlaybackBlockedModalProps {
  isOpen: boolean;
  limit: number;
  planName: string;
}

// Unlike UpgradeSubscriptionModal, this is intentionally non-dismissable — there is no
// onClose passed to ModalHeader (no close button rendered) and both backdrop-click and
// escape are disabled, since playback is genuinely blocked for the rest of the day, not
// just an upsell the user can brush past.
const PlaybackBlockedModal = ({ isOpen, limit, planName }: PlaybackBlockedModalProps) => {
  const t = useTranslations("room");
  const router = useRouter();
  const roomId = useSelector((state: RootState) => state.room.roomId);

  useEffect(() => {
    if (isOpen) {
      trackUpgradeModalShown("daily_limit", roomId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleUpgradeClick = () => {
    trackUpgradeClicked("daily_limit", roomId);
    router.push("/pricing");
  };

  return (
    <Modal
      open={isOpen}
      onClose={() => {}}
      closeOnBackdropClick={false}
      closeOnEscape={false}
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
          title={t("watchLimit.title")}
          titleClassName={`${modalAccentTitleClass} text-base md:text-lg`}
        />

        <div className={modalBalancedContentClass}>
          <p className="mb-4 text-xs leading-relaxed text-white/70 md:mb-5 md:text-sm">
            {t("watchLimit.message", { limit, planName })}
          </p>

          <button
            onClick={handleUpgradeClick}
            className={`${modalBrandActionButtonClass} flex w-full items-center justify-center gap-1.5 font-semibold`}
          >
            <LuSparkles size={16} />
            <span>{t("watchLimit.upgradeCta")}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default PlaybackBlockedModal;
