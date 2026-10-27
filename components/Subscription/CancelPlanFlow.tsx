"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LuCalendarClock, LuCrown, LuGift, LuMessageCircle } from "react-icons/lu";
import {
  Modal,
  ModalHeader,
  modalAccentIconWrapClass,
  modalAccentTitleClass,
  modalBalancedContentClass,
  modalBrandActionButtonClass,
  modalConfirmActionButtonClass,
  modalDiscardActionButtonClass,
  modalSegmentedControlButtonActiveClass,
  modalSegmentedControlButtonClass,
  modalSegmentedControlClass,
  modalSubtleCloseButtonClass,
  modalTextAreaClass,
} from "@/components/UI";
import {
  cancelReasonOptionActiveClass,
  cancelReasonOptionClass,
} from "@/components/UI/classTokens";
import { useTranslations } from "@/i18n/I18nProvider";
import {
  useApplyRetentionOfferMutation,
  useCancelMySubscriptionMutation,
} from "@/lib/store/api/userApi";
import {
  trackCancelFlowStarted,
  trackRetentionOfferAccepted,
  trackRetentionOfferShown,
  trackSubscriptionCancelled,
  type CancelReason,
  type RetentionOfferKind,
} from "@/lib/analytics";
import type { UserSubscription } from "@/types/subscriptionTypes";
import { getApiErrorMessage } from "@/utils/apiError";
import { showError, showSuccess } from "@/utils/toast";

type Step = "reason" | "offer" | "confirm";

const REASONS: CancelReason[] = [
  "together",
  "not_using",
  "price",
  "technical",
  "missing_feature",
  "other",
];

// The reasons a short break or a free month actually answers. "Something broke" or "it is
// missing a feature" is not fixed by a cheaper month, so those go straight to the confirm step
// with their note, and the note is what gets read.
const OFFER_FOR_REASON: Partial<Record<CancelReason, RetentionOfferKind>> = {
  together: "pause",
  not_using: "pause",
  price: "free_month",
};

// Where a note is worth asking for: the reasons a fixed list cannot describe.
const NOTE_REASONS = new Set<CancelReason>(["technical", "missing_feature", "other"]);

const PAUSE_MONTHS = [1, 2, 3] as const;

// Same clamp as guardian's addMonthsUTC, so the date promised here is the date Dodo is given.
function addMonthsUTC(date: Date, months: number): Date {
  const result = new Date(date.getTime());
  const day = result.getUTCDate();
  result.setUTCDate(1);
  result.setUTCMonth(result.getUTCMonth() + months);
  const lastDay = new Date(
    Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0),
  ).getUTCDate();
  result.setUTCDate(Math.min(day, lastDay));
  return result;
}

interface CancelPlanFlowProps {
  open: boolean;
  onClose: () => void;
  subscription: UserSubscription | null | undefined;
  planName: string;
  isOnHold: boolean;
  formatDate: (value?: string | Date | null) => string | null;
  /** Called with the server's new view of the subscription after a cancel or an offer. */
  onUpdated: (subscription: UserSubscription) => void;
}

/**
 * Cancelling, in three short steps: why, a save offer when one fits the reason, then the
 * confirm that was the whole flow before.
 *
 * Cancelling stays one decision away at every step — "Cancel anyway" sits beside every offer
 * — because the point is to answer the reason, not to make leaving hard. Most long-distance
 * couples who leave do so because they are finally in the same place; for them a break is the
 * right answer, and they come back to a plan that is still on.
 */
export default function CancelPlanFlow({
  open,
  onClose,
  subscription,
  planName,
  isOnHold,
  formatDate,
  onUpdated,
}: CancelPlanFlowProps) {
  const t = useTranslations("subscription");
  const [step, setStep] = useState<Step>("reason");
  const [reason, setReason] = useState<CancelReason | null>(null);
  const [note, setNote] = useState("");
  const [pauseMonths, setPauseMonths] = useState<number>(1);
  const [cancelMySubscription, { isLoading: isCancelling }] = useCancelMySubscriptionMutation();
  const [applyRetentionOffer, { isLoading: isApplyingOffer }] = useApplyRetentionOfferMutation();
  const isBusy = isCancelling || isApplyingOffer;

  const planSlug = subscription?.plan?.slug;
  const offer = reason && subscription?.retention_offer_available ? OFFER_FOR_REASON[reason] : undefined;
  const offerMonths = offer === "free_month" ? 1 : pauseMonths;
  const nextBilling = subscription?.end_date ? new Date(subscription.end_date) : null;
  const movedBillingDate =
    nextBilling && !Number.isNaN(nextBilling.getTime())
      ? formatDate(addMonthsUTC(nextBilling, offerMonths))
      : null;

  // Every opening starts fresh at the first step.
  useEffect(() => {
    if (!open) return;
    setStep("reason");
    setReason(null);
    setNote("");
    setPauseMonths(1);
    trackCancelFlowStarted(planSlug);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const close = () => {
    if (!isBusy) onClose();
  };

  const continueFromReason = () => {
    if (!reason) return;
    if (offer) {
      trackRetentionOfferShown(offer, reason);
      setStep("offer");
    } else {
      setStep("confirm");
    }
  };

  const handleAcceptOffer = async () => {
    if (!offer || !reason) return;
    try {
      const response = await applyRetentionOffer({
        offer,
        months: offerMonths,
        reason,
      }).unwrap();
      trackRetentionOfferAccepted(offer, reason, offerMonths);
      onUpdated(response.data);
      showSuccess(
        t(offer === "pause" ? "cancelFlow.toast.paused" : "cancelFlow.toast.freeMonth", {
          date: formatDate(response.data.end_date) ?? movedBillingDate ?? "",
        }),
      );
      onClose();
    } catch (error: unknown) {
      showError(
        t("cancelFlow.toast.offerFailedTitle"),
        getApiErrorMessage(error, t("cancelFlow.toast.offerFailedDefault")),
      );
    }
  };

  const handleCancel = async () => {
    try {
      const trimmedNote = note.trim();
      const response = await cancelMySubscription(
        reason ? { reason: trimmedNote ? `${reason}: ${trimmedNote}` : reason } : undefined,
      ).unwrap();
      trackSubscriptionCancelled(reason, planSlug);
      onUpdated(response.data);
      // An on-hold plan ends on the spot — there is no billing period left to wait out — so
      // it gets its own confirmation rather than "stops renewing at the end of the period".
      showSuccess(t(isOnHold ? "toast.cancelOnHoldSuccess" : "toast.cancelSuccess"));
      onClose();
    } catch (cancelError: unknown) {
      showError(
        t("toast.cancelFailedTitle"),
        getApiErrorMessage(cancelError, t("toast.cancelFailedDefault")),
      );
    }
  };

  const header = (icon: React.ReactNode, title: string) => (
    <ModalHeader
      className="mb-1 px-0 pt-0 pb-0"
      icon={<div className={modalAccentIconWrapClass}>{icon}</div>}
      title={title}
      titleClassName={`${modalAccentTitleClass} text-base md:text-lg`}
      onClose={close}
      closeButtonClassName={modalSubtleCloseButtonClass}
    />
  );

  return (
    <Modal
      open={open}
      onClose={close}
      closeOnBackdropClick={!isBusy}
      closeOnEscape={!isBusy}
      overlayClassName="z-[99999]"
      panelClassName="max-w-md overflow-hidden rounded-2xl bg-[linear-gradient(180deg,rgba(30,30,40,0.98),rgba(18,18,24,0.98))] ring-1 ring-white/10 shadow-2xl backdrop-blur-2xl"
    >
      <div className="w-full">
        {step === "reason" && (
          <>
            {header(<LuMessageCircle size={18} />, t("cancelFlow.reasonTitle"))}
            <div className={modalBalancedContentClass}>
            <p className="mb-4 text-xs leading-relaxed text-white/60 md:text-sm">
              {t("cancelFlow.reasonSubtitle")}
            </p>

            <div role="radiogroup" className="space-y-2">
              {REASONS.map((key) => (
                <button
                  key={key}
                  type="button"
                  role="radio"
                  aria-checked={reason === key}
                  onClick={() => setReason(key)}
                  className={reason === key ? cancelReasonOptionActiveClass : cancelReasonOptionClass}
                >
                  <span
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full ring-1 ${
                      reason === key ? "ring-pink-400" : "ring-white/25"
                    }`}
                  >
                    {reason === key && <span className="h-2 w-2 rounded-full bg-pink-400" />}
                  </span>
                  <span>{t(`cancelFlow.reasons.${key}`)}</span>
                </button>
              ))}
            </div>

            {reason && NOTE_REASONS.has(reason) && (
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value.slice(0, 500))}
                placeholder={t("cancelFlow.notePlaceholder")}
                className={`${modalTextAreaClass} mt-3 min-h-[84px] text-[13px]`}
              />
            )}

            <div className="mt-5 flex gap-2 md:gap-3">
              <button type="button" onClick={close} className={modalDiscardActionButtonClass}>
                {t("cancelModal.keepPlan")}
              </button>
              <button
                type="button"
                onClick={continueFromReason}
                disabled={!reason}
                className={`${modalBrandActionButtonClass} font-semibold disabled:cursor-not-allowed disabled:opacity-40`}
              >
                {t("cancelFlow.continue")}
              </button>
            </div>
            </div>
          </>
        )}

        {step === "offer" && offer && (
          <>
            {offer === "pause"
              ? header(<LuCalendarClock size={18} />, t("cancelFlow.pauseTitle"))
              : header(<LuGift size={18} />, t("cancelFlow.freeMonthTitle", { plan: planName }))}
            <div className={modalBalancedContentClass}>
            <p className="text-xs leading-relaxed text-white/70 md:text-sm">
              {offer === "pause"
                ? t("cancelFlow.pauseMessage", { plan: planName })
                : t("cancelFlow.freeMonthMessage", { plan: planName })}
            </p>

            {offer === "pause" && (
              <div className={`${modalSegmentedControlClass} mt-4`}>
                {PAUSE_MONTHS.map((months) => (
                  <button
                    key={months}
                    type="button"
                    onClick={() => setPauseMonths(months)}
                    className={`${modalSegmentedControlButtonClass} normal-case ${
                      pauseMonths === months ? modalSegmentedControlButtonActiveClass : ""
                    }`}
                  >
                    {t(`cancelFlow.monthOptions.${months}`)}
                  </button>
                ))}
              </div>
            )}

            {movedBillingDate && (
              <p className="mt-3 rounded-xl bg-white/[0.04] px-3 py-2.5 text-xs leading-relaxed text-white/75">
                {t("cancelFlow.nextPaymentOn", { date: movedBillingDate })}
              </p>
            )}

            <button
              type="button"
              onClick={handleAcceptOffer}
              disabled={isBusy}
              className={`${modalBrandActionButtonClass} mt-4 w-full py-3 font-semibold disabled:opacity-50`}
            >
              {isApplyingOffer
                ? t("cancelFlow.applying")
                : offer === "pause"
                  ? t("cancelFlow.pauseCta", { duration: t(`cancelFlow.monthOptions.${pauseMonths}`) })
                  : t("cancelFlow.freeMonthCta")}
            </button>

            {offer === "free_month" && subscription?.plan?.billing_cycle === "monthly" && (
              <p className="mt-3 text-center text-xs text-white/50">
                {t("cancelFlow.yearlyHint")}{" "}
                <Link href="/pricing" className="font-medium text-pink-300 hover:text-pink-200">
                  {t("cancelFlow.yearlyLink")}
                </Link>
              </p>
            )}

            <button
              type="button"
              onClick={() => setStep("confirm")}
              disabled={isBusy}
              className="mt-2 w-full rounded-xl py-2 text-xs font-medium text-white/45 transition-colors hover:text-white/75"
            >
              {t("cancelFlow.cancelAnyway")}
            </button>
            </div>
          </>
        )}

        {step === "confirm" && (
          <>
            {header(<LuCrown size={18} />, t("cancelModal.title", { plan: planName }))}
            <div className={modalBalancedContentClass}>
            <p className="text-xs leading-relaxed text-white/70 md:text-sm">
              {isOnHold
                ? t("cancelModal.onHoldMessage", { plan: planName })
                : t("cancelModal.message", { plan: planName })}
            </p>
            <div className="mt-5 flex gap-2 md:gap-3">
              <button type="button" onClick={close} className={modalDiscardActionButtonClass}>
                {t("cancelModal.keepPlan")}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={isBusy}
                className={`${modalConfirmActionButtonClass} disabled:opacity-50`}
              >
                {isCancelling ? t("cancelModal.cancelling") : t("cancelPlan")}
              </button>
            </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
