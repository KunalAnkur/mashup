"use client";
import { useEffect } from "react";
import { LuSparkles, LuCheck, LuInfo } from "react-icons/lu";
import { useTranslations } from "@/i18n/I18nProvider";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import { trackUpgradeModalShown, trackUpgradeClicked } from "@/lib/analytics";
import {
  Modal,
  ModalHeader,
  modalAccentIconWrapClass,
  modalAccentTitleClass,
  modalBrandActionButtonClass,
  modalConfirmSurfaceClass,
  modalBalancedContentClass,
  modalSubtleCloseButtonClass,
  modalDiscardActionButtonClass,
} from "@/components/UI";

interface UpgradeSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
  isHost?: boolean;
  /** What the user was trying to do. Drives the copy — asking about calls should not be
   *  told the room is full, which is what happened when every caller shared one message. */
  context?: "room_full" | "calls" | "watch_limit";
}

const UpgradeSubscriptionModal = ({
  isOpen,
  onClose,
  message,
  isHost: isHostProp,
  context = "room_full",
}: UpgradeSubscriptionModalProps) => {
  const tCommon = useTranslations("common");
  const t = useTranslations("room.upgrade");
  const roomState = useSelector((state: RootState) => state.room);

  // Determine if user is host (from prop or room state)
  const isHost = isHostProp !== undefined ? isHostProp : roomState.host;

  // Copy per context. `watch_limit` has no guest variant on purpose: the allowance belongs
  // to the host, so only they are ever shown this prompt.
  const copy = {
    calls: { title: t("callsTitle"), message: t("callsMessage") },
    watch_limit: { title: t("watchLimitTitle"), message: t("watchLimitMessage") },
    room_full: {
      title: isHost ? t("roomFullTitle") : t("guestRoomFullTitle"),
      message: isHost ? t("roomFullMessage") : t("guestRoomFullMessage"),
    },
  }[context];

  const displayMessage = message || copy.message;
  const modalTitle = copy.title;
  const modalIcon = isHost ? <LuSparkles size={18} /> : <LuInfo size={18} />;
  const analyticsContext =
    context === "room_full"
      ? roomState.settings.upgradeSubscriptionContext || "room_full"
      : context;

  useEffect(() => {
    if (isOpen) {
      trackUpgradeModalShown(analyticsContext, roomState.roomId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleUpgrade = () => {
    trackUpgradeClicked(analyticsContext, roomState.roomId);
    // New tab, not router.push: every context here fires from inside a live room, and
    // navigating away drops the host out of the watch party to go read pricing.
    window.open("/pricing", "_blank", "noopener,noreferrer");
    onClose();
  };

  // Benefits shared by every paid plan. Deliberately no participant count: that number
  // differs per tier and has already changed once, so /pricing is where it belongs.
  const paidPlanBenefits = [
    t("benefits.videoCalls"),
    t("benefits.unlimitedWatch"),
    t("benefits.morePeople"),
    t("benefits.quality"),
  ];

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      closeOnBackdropClick={true}
      closeOnEscape={true}
      overlayClassName="upgrade-subscription-modal z-[99999]"
      panelClassName={`${modalConfirmSurfaceClass} max-w-md`}
    >
      <div className="w-full">
        <ModalHeader
          className="mb-4 px-0 pt-0 pb-0"
          icon={
            <div className={modalAccentIconWrapClass}>
              {modalIcon}
            </div>
          }
          title={modalTitle}
          titleClassName={`${modalAccentTitleClass} text-base md:text-lg`}
          onClose={onClose}
          closeButtonClassName={modalSubtleCloseButtonClass}
        />

        <div className={modalBalancedContentClass}>
          {/* Message */}
          <p className="mb-4 text-xs leading-relaxed text-white/70 md:mb-5 md:text-sm">
            {displayMessage}
          </p>

          {/* Paid-plan benefits — only the host can act on them */}
          {isHost && (
            <div className="mb-4 space-y-2 rounded-xl bg-white/[0.045] p-4 md:mb-5">
              <h4 className="mb-3 text-sm font-semibold text-white">
                {t("benefitsHeading")}
              </h4>
              {paidPlanBenefits.map((feature, index) => (
                <div key={index} className="flex items-start gap-2">
                  <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-pink-500/20 via-rose-500/20 to-purple-500/20">
                    <LuCheck size={12} className="text-pink-400" />
                  </div>
                  <span className="text-xs text-white/80">{feature}</span>
                </div>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 md:gap-3">
            {isHost ? (
              <>
                <button
                  onClick={onClose}
                  className={`${modalDiscardActionButtonClass} flex-1`}
                >
                  {tCommon("cancel")}
                </button>
                <button
                  onClick={handleUpgrade}
                  className={`${modalBrandActionButtonClass} flex flex-1 items-center justify-center gap-1.5 font-semibold`}
                >
                  <LuSparkles size={16} />
                  <span>{t("upgradeNow")}</span>
                </button>
              </>
            ) : (
              <button
                onClick={onClose}
                className={`${modalBrandActionButtonClass} w-full`}
              >
                {tCommon("close")}
              </button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default UpgradeSubscriptionModal;

// Made with Bob
