"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import { LuArrowRight, LuCheck, LuCrown, LuSparkles } from "react-icons/lu";
import { EntryPageHeader, Modal, ModalConfirmContent } from "@/components/UI";
import {
  appEntryActionButtonBaseClass,
  appEntryPageContentWrapClass,
  appEntryPageFixedHeaderOffsetClass,
  appEntryPageInsetClass,
  appEntryPageShellClass,
  appEntrySecondaryButtonClass,
  appFlexibleViewportPageClass,
  appPulseSurfaceClass,
  appTransactionRowClass,
  appTransactionStatusBadgeClass,
  appTransactionStatusCompletedClass,
  appTransactionStatusFailedClass,
  appTransactionStatusNeutralClass,
  appTransactionStatusProcessingClass,
  appWhiteBorderClass,
  pricingPaidCardSurfaceClass,
} from "@/components/UI/classTokens";
import { RootState } from "@/lib/store";
import {
  useCancelMySubscriptionMutation,
  useGetMySubscriptionQuery,
  useReactivateMySubscriptionMutation,
} from "@/lib/store/api/userApi";
import {
  PaymentTransactionSummary,
  useCancelChangePlanMutation,
  useGetMyTransactionsQuery,
} from "@/lib/store/api/billingApi";
import { setSubscription } from "@/lib/store/slices/subscriptionSlice";
import { useTranslations } from "@/i18n/I18nProvider";
import {
  formatPlanPrice,
  getTierDisplayName,
  hasActivePaidSubscription,
} from "@/utils/subscription";
import { getApiErrorMessage } from "@/utils/apiError";
import { PaymentStatus, SubscriptionStatus } from "@/types/subscriptionTypes";
import { showError, showSuccess } from "@/utils/toast";

const transactionStatusClassMap: Record<PaymentStatus, string> = {
  [PaymentStatus.PROCESSING]: appTransactionStatusProcessingClass,
  [PaymentStatus.PENDING]: appTransactionStatusProcessingClass,
  [PaymentStatus.COMPLETED]: appTransactionStatusCompletedClass,
  [PaymentStatus.FAILED]: appTransactionStatusFailedClass,
  [PaymentStatus.REFUNDED]: appTransactionStatusNeutralClass,
};

const formatDate = (value?: string | Date | null) => {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
};

const planCardClassName =
  "relative overflow-hidden rounded-[2rem] border border-white/10 px-5 py-5 shadow-[0_24px_80px_rgba(0,0,0,0.24)] sm:px-6 sm:py-6";
const planCardBadgeClassName =
  "inline-flex items-center rounded-full bg-white/[0.05] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/68";
const planCardNameClassName =
  "mt-4 font-parkinsans text-[2rem] font-semibold leading-none tracking-[-0.05em] text-white md:text-[2.35rem]";
const planCardIconClassName =
  "flex h-10 w-10 items-center justify-center rounded-[1rem] bg-white/[0.05] text-white/90";
const planCardPriceRowClassName = "mt-5 flex items-end gap-2";
const planCardPriceClassName =
  "font-parkinsans text-[2.35rem] font-semibold text-white md:text-[2.7rem]";
const planCardCadenceClassName = "pb-1 text-[13px] capitalize text-white/42";
const planCardPerksClassName = "mt-5 space-y-2.5";
const planCardPerkItemClassName =
  "flex items-center gap-3 text-[13px] leading-5 text-white/74 md:text-sm md:leading-6";
const planCardPerkIconClassName =
  "flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-white/[0.05] text-white/80";
const planCardActionsClassName = "mt-6 space-y-2.5";
const skeletonCardClassName = `${planCardClassName} ${appPulseSurfaceClass} h-[380px]`;

export default function SubscriptionPage() {
  const dispatch = useDispatch();
  const t = useTranslations("subscription");
  const storedSubscription = useSelector(
    (state: RootState) => state.subscription.subscription,
  );
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const { data, isLoading, refetch } = useGetMySubscriptionQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const [cancelMySubscription, { isLoading: isCancelling }] =
    useCancelMySubscriptionMutation();
  const [reactivateMySubscription, { isLoading: isReactivating }] =
    useReactivateMySubscriptionMutation();
  const [cancelChangePlan, { isLoading: isCancellingChange }] =
    useCancelChangePlanMutation();
  const { data: transactionsData, isLoading: isLoadingTransactions } =
    useGetMyTransactionsQuery();

  const subscription = data?.data ?? storedSubscription;
  const transactions = transactionsData?.data ?? [];

  useEffect(() => {
    if (data?.data) {
      dispatch(setSubscription(data.data));
    }
  }, [data, dispatch]);

  const isPaid = hasActivePaidSubscription(subscription);
  const isCancellationScheduled =
    subscription?.status === SubscriptionStatus.CANCELLED;
  const canCancel = isPaid && !isCancellationScheduled;
  const cancellationDate = formatDate(subscription?.end_date);
  const plan = subscription?.plan;
  const tierDisplayName = getTierDisplayName(subscription?.tier);
  const pendingPlan = subscription?.pending_plan;
  const pendingChangeDate = formatDate(subscription?.pending_change_effective_at);

  const perks = useMemo(() => {
    if (!plan?.features) return [];

    const features = plan.features;
    const bullets = [
      t("features.participants", { count: features.max_room_participants }),
      features.max_watch_minutes_per_day === -1
        ? t("features.watchUnlimited")
        : t("features.watchLimitDaily", { minutes: features.max_watch_minutes_per_day }),
      t("features.screenShare", { quality: features.screen_share_quality }),
    ];

    if (features.ad_free_experience) {
      bullets.push(t("features.adFree"));
    }

    return bullets;
  }, [plan, t]);

  const getTransactionLabel = (transaction: PaymentTransactionSummary) => {
    const plan = transaction.planName ?? transaction.planSlug;

    if (transaction.direction === "upgrade") {
      return plan ? t("transactions.upgradeTo", { plan }) : t("transactions.upgrade");
    }
    if (transaction.direction === "downgrade") {
      return plan ? t("transactions.downgradeTo", { plan }) : t("transactions.downgrade");
    }
    return plan ? t("transactions.newSubscriptionTo", { plan }) : t("transactions.newSubscription");
  };

  const handleCancelPendingChange = async () => {
    try {
      await cancelChangePlan().unwrap();
      await refetch();
      showSuccess(t("toast.pendingChangeCancelled"));
    } catch (cancelError: unknown) {
      const message = getApiErrorMessage(cancelError, t("toast.pendingChangeCancelFailed"));
      showError(t("toast.cancelFailedTitle"), message);
    }
  };

  const handleCancelSubscription = async () => {
    try {
      const response = await cancelMySubscription().unwrap();
      dispatch(setSubscription(response.data));
      setShowCancelConfirm(false);
      showSuccess(t("toast.cancelSuccess"));
    } catch (cancelError: unknown) {
      const message = getApiErrorMessage(cancelError, t("toast.cancelFailedDefault"));
      showError(t("toast.cancelFailedTitle"), message);
    }
  };

  const handleReactivateSubscription = async () => {
    try {
      const response = await reactivateMySubscription().unwrap();
      dispatch(setSubscription(response.data));
      showSuccess(t("toast.reactivateSuccess"));
    } catch (reactivateError: unknown) {
      const message = getApiErrorMessage(reactivateError, t("toast.reactivateFailedDefault"));
      showError(t("toast.reactivateFailedTitle"), message);
    }
  };

  return (
    <div className={appFlexibleViewportPageClass}>
      <div className={appEntryPageShellClass}>
        <EntryPageHeader title={t("title")} fixed showBrandOnSubpage />

        <main
          className={`flex-1 overflow-y-auto overflow-x-hidden ${appEntryPageFixedHeaderOffsetClass}`}
        >
          <div className={appEntryPageInsetClass}>
            <div className={appEntryPageContentWrapClass}>
              <section className="mx-auto max-w-xl space-y-5 pb-6 pt-5 md:space-y-6 md:pb-8 md:pt-8">
                <section className="mx-auto max-w-xl text-center">
                  <h1 className="font-parkinsans text-[2.5rem] font-semibold tracking-[-0.04em] text-white md:text-[2.85rem]">
                    {t("title")}
                  </h1>
                </section>

                {isLoading || !plan ? (
                  <div className={skeletonCardClassName} />
                ) : (
                  <article
                    className={`${planCardClassName} ${
                      isPaid ? pricingPaidCardSurfaceClass : "bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.03))]"
                    }`}
                  >
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/10" />

                    <span
                      className={`${planCardIconClassName} absolute right-5 top-5 sm:right-6 sm:top-6`}
                    >
                      {isPaid ? (
                        <LuCrown className="h-5 w-5" />
                      ) : (
                        <LuSparkles className="h-5 w-5" />
                      )}
                    </span>

                    <span className={planCardBadgeClassName}>{t("currentPlanBadge")}</span>

                    <h2 className={planCardNameClassName}>
                      {isPaid ? tierDisplayName : plan.name}
                    </h2>

                    <div className={planCardPriceRowClassName}>
                      <span className={planCardPriceClassName}>
                        {formatPlanPrice(plan.price, plan.currency)}
                      </span>
                      <div className="flex flex-col gap-0.5 pb-1">
                        <span className={planCardCadenceClassName}>
                          /{plan.billing_cycle}
                        </span>
                      </div>
                    </div>

                    <ul className={planCardPerksClassName}>
                      {perks.map((perk) => (
                        <li key={perk} className={planCardPerkItemClassName}>
                          <span className={planCardPerkIconClassName}>
                            <LuCheck className="h-3 w-3" />
                          </span>
                          <span>{perk}</span>
                        </li>
                      ))}
                    </ul>

                    {pendingPlan && pendingChangeDate ? (
                      <div className="mt-5 flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-white/[0.04] px-4 py-3 text-[13px] text-white/68">
                        <span>
                          {t("pendingChangeBanner", {
                            plan: getTierDisplayName(pendingPlan.tier),
                            date: pendingChangeDate,
                          })}
                        </span>
                        <button
                          type="button"
                          onClick={handleCancelPendingChange}
                          disabled={isCancellingChange}
                          className="font-semibold text-rose-300 transition-colors duration-200 hover:text-rose-200 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isCancellingChange ? t("cancelModal.cancelling") : t("undoPendingChange")}
                        </button>
                      </div>
                    ) : null}

                    {isCancellationScheduled && cancellationDate ? (
                      <div className="mt-5 flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-white/[0.04] px-4 py-3 text-[13px] text-white/68">
                        <span>{t("cancelsOn", { date: cancellationDate })}</span>
                        <button
                          type="button"
                          onClick={handleReactivateSubscription}
                          disabled={isReactivating}
                          className="font-semibold text-rose-300 transition-colors duration-200 hover:text-rose-200 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isReactivating ? t("cancelModal.cancelling") : t("reactivatePlan")}
                        </button>
                      </div>
                    ) : null}

                    <div className={planCardActionsClassName}>
                      <Link
                        href="/pricing"
                        className={`${appEntryActionButtonBaseClass} ${appEntrySecondaryButtonClass} h-11 w-full rounded-[1.15rem] text-sm`}
                      >
                        <span>{t("viewPlans")}</span>
                        <LuArrowRight className="text-base" />
                      </Link>

                      {canCancel ? (
                        <button
                          type="button"
                          onClick={() => setShowCancelConfirm(true)}
                          className={`${appEntryActionButtonBaseClass} h-11 w-full rounded-[1.15rem] bg-red-500/12 px-5 text-sm font-semibold text-red-200 transition-colors duration-200 hover:bg-red-500/18`}
                        >
                          {t("cancelPlan")}
                        </button>
                      ) : null}
                    </div>
                  </article>
                )}

                {isLoadingTransactions ? (
                  <div className={`${skeletonCardClassName} h-[140px]`} />
                ) : transactions.length > 0 ? (
                  <div className="space-y-3">
                    <h2 className="text-[13px] font-semibold uppercase tracking-[0.16em] text-white/48">
                      {t("transactions.title")}
                    </h2>
                    <div className="space-y-2">
                      {transactions.map((transaction) => (
                        <div key={transaction.id} className={appTransactionRowClass}>
                          <div className="flex flex-col gap-0.5">
                            <span className="font-medium text-white/88">
                              {getTransactionLabel(transaction)}
                            </span>
                            <span className="text-white/48">
                              {formatDate(transaction.createdAt)}
                            </span>
                          </div>
                          <div className="flex flex-col items-end gap-1.5">
                            <span className="font-medium text-white/88">
                              {formatPlanPrice(transaction.amount, transaction.currency)}
                            </span>
                            <span
                              className={`${appTransactionStatusBadgeClass} ${transactionStatusClassMap[transaction.status]}`}
                            >
                              {t(`transactions.status.${transaction.status}`)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </section>
            </div>
          </div>
        </main>
      </div>

      <Modal
        open={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
        closeOnBackdropClick={!isCancelling}
        closeOnEscape={!isCancelling}
        overlayClassName="z-[99999]"
        panelClassName={`max-w-sm ${appWhiteBorderClass} rounded-2xl bg-[linear-gradient(180deg,rgba(30,30,40,0.98),rgba(18,18,24,0.98))] shadow-2xl backdrop-blur-2xl`}
      >
        <ModalConfirmContent
          icon={<LuCrown size={18} className="text-current" />}
          title={t("cancelModal.title", { plan: tierDisplayName })}
          message={t("cancelModal.message", { plan: tierDisplayName })}
          cancelLabel={t("cancelModal.keepPlan")}
          confirmLabel={isCancelling ? t("cancelModal.cancelling") : t("cancelPlan")}
          onCancel={() => setShowCancelConfirm(false)}
          onConfirm={handleCancelSubscription}
          confirmDisabled={isCancelling}
        />
      </Modal>
    </div>
  );
}
