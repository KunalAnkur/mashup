"use client";
import { useEffect } from "react";
import { LuSparkles, LuInfo } from "react-icons/lu";
import { useTranslations } from "@/i18n/I18nProvider";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import { trackUpgradeModalShown, type UpgradePromptContext } from "@/lib/analytics";
import { SubscriptionTier } from "@/types/subscriptionTypes";
import UpgradePlanOffer, {
  type UpgradeOfferLead,
  type UpgradeOfferTier,
} from "@/components/Modals/UpgradePlanOffer";
import {
  Modal,
  ModalHeader,
  modalAccentIconWrapClass,
  modalAccentTitleClass,
  modalBrandActionButtonClass,
  modalConfirmSurfaceClass,
  modalBalancedContentClass,
  modalSubtleCloseButtonClass,
} from "@/components/UI";

interface UpgradeSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
  isHost?: boolean;
  /** What the user was trying to do. Drives the copy — asking about calls should not be
   *  told the room is full, which is what happened when every caller shared one message. */
  context?: "room_full" | "calls" | "watch_limit" | "games";
  /** What analytics records, when it is more specific than `context` (a per-session watch
   *  cap shows the watch-limit copy but is its own funnel). Defaults to `context`. */
  analyticsContext?: UpgradePromptContext;
}

const UpgradeSubscriptionModal = ({
  isOpen,
  onClose,
  message,
  isHost: isHostProp,
  context = "room_full",
  analyticsContext: analyticsContextProp,
}: UpgradeSubscriptionModalProps) => {
  const tCommon = useTranslations("common");
  const t = useTranslations("room.upgrade");
  const roomState = useSelector((state: RootState) => state.room);
  const currentTier = useSelector(
    (state: RootState) => state.subscription.subscription?.plan?.tier,
  );

  // Determine if user is host (from prop or room state)
  const isHost = isHostProp !== undefined ? isHostProp : roomState.host;

  // Copy per context. `watch_limit` has no guest variant on purpose: the allowance belongs
  // to the host, so only they are ever shown this prompt.
  const copy = {
    calls: { title: t("callsTitle"), message: t("callsMessage") },
    watch_limit: { title: t("watchLimitTitle"), message: t("watchLimitMessage") },
    // No guest variant: only the host can start a game, so only they reach this.
    games: { title: t("gameTitle"), message: t("gameMessage") },
    room_full: {
      title: isHost ? t("roomFullTitle") : t("guestRoomFullTitle"),
      message: isHost ? t("roomFullMessage") : t("guestRoomFullMessage"),
    },
  }[context];

  const displayMessage = message || copy.message;
  const modalTitle = copy.title;
  const modalIcon = isHost ? <LuSparkles size={18} /> : <LuInfo size={18} />;
  const analyticsContext = analyticsContextProp ?? context;

  useEffect(() => {
    if (isOpen) {
      trackUpgradeModalShown(analyticsContext, roomState.roomId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // The plan that fixes what they hit. A full room needs Crowd: Couple holds two people, the
  // same as Free, so offering it there would sell a fix that does not fix anything. Everything
  // else is unlocked by Couple, the cheaper of the two. A Crowd host whose room is full is
  // already on the biggest plan, so they get the message and nothing to buy.
  const offer: { tier: UpgradeOfferTier; lead: UpgradeOfferLead } | null = (() => {
    if (!isHost) return null;
    if (context === "room_full") {
      return currentTier === SubscriptionTier.CROWD
        ? null
        : { tier: SubscriptionTier.CROWD, lead: "people" };
    }
    const lead: UpgradeOfferLead =
      context === "watch_limit" ? "watch_time" : context === "calls" ? "calls" : "games";
    return { tier: SubscriptionTier.COUPLE, lead };
  })();

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

          {offer ? (
            <UpgradePlanOffer
              tier={offer.tier}
              lead={offer.lead}
              context={analyticsContext}
              roomId={roomState.roomId}
              onChosen={onClose}
            />
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
    </Modal>
  );
};

export default UpgradeSubscriptionModal;

// Made with Bob
