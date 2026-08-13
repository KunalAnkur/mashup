"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import { LuArrowRight, LuClock, LuCrown, LuMonitor, LuSparkles, LuUsers } from "react-icons/lu";
import { Modal, ModalConfirmContent } from "@/components/UI";
import {
  appPulseSurfaceClass,
  appSectionTitleTextClass,
  appWhiteBorderClass,
  dashPageContentWrapClass,
  dashPageTitleWrapClass,
  pricingPaidCardSurfaceClass,
  subPageWrapClass,
  subPlanActionsClass,
  subPlanBadgeClass,
  subPlanBannerClass,
  subPlanBodyClass,
  subPlanGlowClass,
  subPlanCadenceClass,
  subPlanGhostActionClass,
  subPlanIconClass,
  subPlanNameClass,
  subPlanFooterClass,
  subPlanFooterLinkClass,
  subPlanFooterTextClass,
  subPlanHeaderClass,
  subPlanPerkClass,
  subPlanPerkIconClass,
  subPlanPerksRowClass,
  subPlanPriceClass,
  subPlanPriceRowClass,
  subPlanPrimaryActionClass,
} from "@/components/UI/classTokens";
import { PurchaseHistory } from "@/components/Subscription/PurchaseHistory";
import { RootState } from "@/lib/store";
import {
  useCancelMySubscriptionMutation,
  useGetMySubscriptionQuery,
  useReactivateMySubscriptionMutation,
} from "@/lib/store/api/userApi";
import {
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
import { SubscriptionStatus } from "@/types/subscriptionTypes";
import { showError, showSuccess } from "@/utils/toast";

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

const skeletonBannerClass = `${subPlanBannerClass} ${appPulseSurfaceClass} h-[250px]`;

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
  // Same field, different meaning depending on auto_renew: end_date is when the plan lapses
  // if cancelled, or when it renews if not.
  const renewalDate = formatDate(subscription?.end_date);
  const plan = subscription?.plan;
  const tierDisplayName = getTierDisplayName(subscription?.tier);
  const pendingPlan = subscription?.pending_plan;
  const pendingChangeDate = formatDate(subscription?.pending_change_effective_at);

  const perks = useMemo(() => {
    if (!plan?.features) return [];

    const features = plan.features;

    // Each perk gets its own icon and tint (people/time/quality) instead of one flat
    // checkmark repeated three times, so the row reads at a glance instead of as a list.
    return [
      {
        label: t("features.participants", { count: features.max_room_participants }),
        Icon: LuUsers,
        iconClassName: "bg-sky-500/14 text-sky-300",
      },
      {
        label:
          features.max_watch_minutes_per_day === -1
            ? t("features.watchUnlimited")
            : t("features.watchLimitDaily", { minutes: features.max_watch_minutes_per_day }),
        Icon: LuClock,
        iconClassName: "bg-amber-500/14 text-amber-300",
      },
      {
        label: t("features.screenShare", { quality: features.screen_share_quality }),
        Icon: LuMonitor,
        iconClassName: "bg-violet-500/14 text-violet-300",
      },
    ];

    // No "ad-free" bullet: Movmash shows no ads on any plan, including Free, so listing it
    // as a paid perk implies Free is ad-supported. The ad_free_experience flag still exists
    // on plans in case that ever changes.
  }, [plan, t]);

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
    <>
        <div className={dashPageContentWrapClass}>
          <div className={subPageWrapClass}>
            <div className={`${dashPageTitleWrapClass} justify-center`}>
              <h1 className={appSectionTitleTextClass}>{t("title")}</h1>
            </div>

                {isLoading || !plan ? (
                  <div className={skeletonBannerClass} />
                ) : (
                  <article
                    className={`${subPlanBannerClass} ${
                      isPaid
                        ? pricingPaidCardSurfaceClass
                        : "bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.03))]"
                    }`}
                  >
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/[0.07]" />
        <div className={subPlanGlowClass} />
                    {isPaid ? <div className={subPlanGlowClass} /> : null}

                    <div className={subPlanBodyClass}>
                      <div className={subPlanHeaderClass}>
                        <span className={subPlanBadgeClass}>{t("currentPlanBadge")}</span>
                        <span className={subPlanIconClass}>
                          {isPaid ? <LuCrown className="h-5 w-5" /> : <LuSparkles className="h-5 w-5" />}
                        </span>
                      </div>

                      <h2 className={subPlanNameClass}>{isPaid ? tierDisplayName : plan.name}</h2>

                      <div className={subPlanPriceRowClass}>
                        <span className={subPlanPriceClass}>
                          {formatPlanPrice(plan.price, plan.currency)}
                        </span>
                        <span className={subPlanCadenceClass}>/{plan.billing_cycle}</span>
                      </div>

                      <div className={subPlanPerksRowClass}>
                        {perks.map(({ label, Icon, iconClassName }) => (
                          <span key={label} className={subPlanPerkClass}>
                            <span className={`${subPlanPerkIconClass} ${iconClassName}`}>
                              <Icon className="h-[11px] w-[11px]" />
                            </span>
                            <span>{label}</span>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* What happens next, and what you can do about it — one baseline.
                        Exactly one of these states is live at a time: a scheduled plan
                        change supersedes the renewal date, and a scheduled cancellation
                        supersedes both. */}
                    <div className={subPlanFooterClass}>
                      <p className={subPlanFooterTextClass}>
                        {pendingPlan && pendingChangeDate ? (
                          <>
                            {t("pendingChangeBanner", {
                              plan: getTierDisplayName(pendingPlan.tier),
                              date: pendingChangeDate,
                            })}{" "}
                            <button
                              type="button"
                              onClick={handleCancelPendingChange}
                              disabled={isCancellingChange}
                              className={subPlanFooterLinkClass}
                            >
                              {isCancellingChange ? t("cancelModal.cancelling") : t("undoPendingChange")}
                            </button>
                          </>
                        ) : isCancellationScheduled && cancellationDate ? (
                          <>
                            {t("cancelsOn", { date: cancellationDate })}{" "}
                            <button
                              type="button"
                              onClick={handleReactivateSubscription}
                              disabled={isReactivating}
                              className={subPlanFooterLinkClass}
                            >
                              {isReactivating ? t("cancelModal.cancelling") : t("reactivatePlan")}
                            </button>
                          </>
                        ) : isPaid && renewalDate ? (
                          <>
                            {plan.billing_cycle === "yearly"
                              ? t("renewsYearlyOn", { date: renewalDate })
                              : t("renewsOn", { date: renewalDate })}{" "}
                            <span className="text-white/38">{t("cancelAnytimeHint")}</span>
                          </>
                        ) : (
                          t("freePlanHint")
                        )}
                      </p>

                      <div className={subPlanActionsClass}>
                        <Link href="/pricing" className={subPlanPrimaryActionClass}>
                          <span>{t("viewPlans")}</span>
                          <LuArrowRight className="text-[13px]" />
                        </Link>

                        {canCancel ? (
                          <button
                            type="button"
                            onClick={() => setShowCancelConfirm(true)}
                            className={subPlanGhostActionClass}
                          >
                            {t("cancelPlan")}
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </article>
                )}

                <section className="space-y-3">
                  <h2 className="text-[13px] font-semibold uppercase tracking-[0.16em] text-white/48">
                    {t("transactions.title")}
                  </h2>
                  <PurchaseHistory
                    transactions={transactions}
                    isLoading={isLoadingTransactions}
                  />
                </section>
          </div>
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
    </>
  );
}
