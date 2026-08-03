"use client";
import { useEffect } from "react";
import { LuSparkles, LuCheck, LuInfo } from "react-icons/lu";
import { useRouter } from "next/navigation";
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
}

const UpgradeSubscriptionModal = ({
  isOpen,
  onClose,
  message,
  isHost: isHostProp,
}: UpgradeSubscriptionModalProps) => {
  const tCommon = useTranslations("common");
  const router = useRouter();
  const roomState = useSelector((state: RootState) => state.room);
  
  // Determine if user is host (from prop or room state)
  const isHost = isHostProp !== undefined ? isHostProp : roomState.host;

  // Different messages for host vs guest
  const defaultHostMessage = "Your room has reached its participant limit. Upgrade to Premium to host watch parties with up to 50 participants!";
  const defaultGuestMessage = "This room is full. The host needs to upgrade to Premium to allow more participants.";
  
  const displayMessage = message || (isHost ? defaultHostMessage : defaultGuestMessage);
  const modalTitle = isHost ? "Upgrade to Premium" : "Room is Full";
  const modalIcon = isHost ? <LuSparkles size={18} /> : <LuInfo size={18} />;
  const analyticsContext = roomState.settings.upgradeSubscriptionContext || "room_full";

  useEffect(() => {
    if (isOpen) {
      trackUpgradeModalShown(analyticsContext, roomState.roomId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleUpgrade = () => {
    trackUpgradeClicked(analyticsContext, roomState.roomId);
    router.push("/pricing");
    onClose();
  };

  const premiumFeatures = [
    "Host rooms with up to 50 participants",
    "Watch parties with more friends",
    "Priority support",
    "Ad-free experience",
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

          {/* Premium Features - Only show for host */}
          {isHost && (
            <div className="mb-4 space-y-2 rounded-xl bg-white/[0.045] p-4 md:mb-5">
              <h4 className="mb-3 text-sm font-semibold text-white">
                Premium Features:
              </h4>
              {premiumFeatures.map((feature, index) => (
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
                  <span>Upgrade Now</span>
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
