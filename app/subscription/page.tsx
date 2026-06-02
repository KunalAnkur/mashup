"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { LuCheck, LuCrown, LuSparkles } from "react-icons/lu";
import StartPremiumCheckoutButton from "@/components/Billing/StartPremiumCheckoutButton";
import { EntryPageHeader, Modal, ModalConfirmContent } from "@/components/UI";
import {
  appEntryActionButtonBaseClass,
  appEntryPageContentWrapClass,
  appEntryPageFixedHeaderOffsetClass,
  appEntryPageInsetClass,
  appEntryPageShellClass,
  appFlexibleViewportPageClass,
  appWhiteBorderClass,
} from "@/components/UI/classTokens";
import { RootState } from "@/lib/store";
import {
  useCancelMySubscriptionMutation,
  useGetMySubscriptionQuery,
} from "@/lib/store/api/userApi";
import { setSubscription } from "@/lib/store/slices/subscriptionSlice";
import {
  SubscriptionStatus,
  SubscriptionTier,
} from "@/types/subscriptionTypes";
import { showError, showSuccess } from "@/utils/toast";

const freePlan = {
  name: "Free",
  price: "$0",
  cadence: "/month",
  perks: [
    "Small rooms — up to 2 people",
    "2-hour sessions",
    "Basic room UI",
  ],
};

const premiumPlan = {
  name: "Premium",
  price: "$2.99",
  originalPrice: "$9.99",
  cadence: "/month",
  perks: [
    "Large rooms — 50+ people",
    "Unlimited time",
    "Better room UI",
  ],
};

const formatPrice = (price?: number, currency?: string) => {
  if (typeof price !== "number") {
    return null;
  }

  const normalizedCurrency = currency?.toUpperCase() || "USD";

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: normalizedCurrency,
      maximumFractionDigits: price % 1 === 0 ? 0 : 2,
    }).format(price);
  } catch {
    return `$${price}`;
  }
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

const getErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error !== "object" || error === null) {
    return fallback;
  }

  const maybeError = error as {
    data?: { message?: unknown };
    message?: unknown;
  };

  if (typeof maybeError.data?.message === "string") {
    return maybeError.data.message;
  }

  if (typeof maybeError.message === "string") {
    return maybeError.message;
  }

  return fallback;
};

type PlanCardProps = {
  badge: string;
  name: string;
  hideName?: boolean;
  price: string;
  originalPrice?: string;
  limitedPricing?: boolean;
  cadence: string;
  perks: string[];
  icon: React.ReactNode;
  accentClassName: string;
  children?: React.ReactNode;
};

const subscriptionGridClassName = "grid gap-4 md:grid-cols-2";
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
const planCardActionsClassName = "mt-6";

function PlanCard({
  badge,
  name,
  hideName,
  price,
  originalPrice,
  limitedPricing,
  cadence,
  perks,
  icon,
  accentClassName,
  children,
}: PlanCardProps) {
  return (
    <article className={`${planCardClassName} ${accentClassName}`}>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/10" />

      <span className={`${planCardIconClassName} absolute right-5 top-5 sm:right-6 sm:top-6`}>
        {icon}
      </span>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        {limitedPricing && (
          <div className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-rose-300">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
            Limited pricing
          </div>
        )}
        <span className={planCardBadgeClassName}>{badge}</span>
      </div>

      {!hideName && (
        <h2 className={planCardNameClassName}>{name}</h2>
      )}

      <div className={planCardPriceRowClassName}>
        <span className={planCardPriceClassName}>{price}</span>
        <div className="flex flex-col gap-0.5 pb-1">
          {originalPrice && (
            <span className="text-[12px] font-medium leading-none text-white/36 line-through">
              {originalPrice}
            </span>
          )}
          <span className={planCardCadenceClassName}>{cadence}</span>
        </div>
      </div>

      <ul className={planCardPerksClassName}>
        {perks.map((perk) => (
          <li
            key={perk}
            className={planCardPerkItemClassName}
          >
            <span className={planCardPerkIconClassName}>
              <LuCheck className="h-3 w-3" />
            </span>
            <span>{perk}</span>
          </li>
        ))}
      </ul>

      {children ? <div className={planCardActionsClassName}>{children}</div> : null}
    </article>
  );
}

export default function SubscriptionPage() {
  const dispatch = useDispatch();
  const storedSubscription = useSelector(
    (state: RootState) => state.subscription.subscription,
  );
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const { data } = useGetMySubscriptionQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const [cancelMySubscription, { isLoading: isCancelling }] =
    useCancelMySubscriptionMutation();

  const subscription = data?.data ?? storedSubscription;

  useEffect(() => {
    if (data?.data) {
      dispatch(setSubscription(data.data));
    }
  }, [data, dispatch]);

  const isPremiumPlan = subscription?.tier === SubscriptionTier.PREMIUM;
  const isExpired = subscription?.status === SubscriptionStatus.EXPIRED;
  const isCancellationScheduled =
    subscription?.status === SubscriptionStatus.CANCELLED;
  const hasActivePremium = isPremiumPlan && !isExpired;
  const canCancel = hasActivePremium && !isCancellationScheduled;

  const currentPlanName = hasActivePremium
    ? subscription?.plan?.name ?? premiumPlan.name
    : subscription?.tier === SubscriptionTier.FREE
      ? subscription?.plan?.name ?? freePlan.name
      : freePlan.name;
  const currentPrice = hasActivePremium
    ? formatPrice(subscription?.plan?.price, subscription?.plan?.currency) ||
      premiumPlan.price
    : subscription?.tier === SubscriptionTier.FREE
      ? formatPrice(subscription?.plan?.price, subscription?.plan?.currency) ||
        freePlan.price
      : freePlan.price;
  const currentCadence = hasActivePremium
    ? subscription?.plan?.billing_cycle
      ? `/${subscription.plan.billing_cycle}`
      : premiumPlan.cadence
    : subscription?.tier === SubscriptionTier.FREE && subscription?.plan?.billing_cycle
      ? `/${subscription.plan.billing_cycle}`
      : freePlan.cadence;
  const cancellationDate = formatDate(subscription?.end_date);

  const handleCancelSubscription = async () => {
    try {
      const response = await cancelMySubscription().unwrap();
      dispatch(setSubscription(response.data));
      setShowCancelConfirm(false);
      showSuccess(
        "Your plan will stop renewing at the end of the current billing period.",
      );
    } catch (cancelError: unknown) {
      const message = getErrorMessage(
        cancelError,
        "Unable to cancel your subscription right now.",
      );
      showError("Subscription cancellation failed", message);
    }
  };

  return (
    <div className={appFlexibleViewportPageClass}>
      <div className={appEntryPageShellClass}>
        <EntryPageHeader title="Subscription" fixed showBrandOnSubpage />

        <main
          className={`flex-1 overflow-y-auto overflow-x-hidden ${appEntryPageFixedHeaderOffsetClass}`}
        >
          <div className={appEntryPageInsetClass}>
            <div className={appEntryPageContentWrapClass}>
              <section className="mx-auto max-w-5xl space-y-5 pb-6 pt-5 md:space-y-6 md:pb-8 md:pt-8">
                <section className="mx-auto max-w-xl text-center">
                  <h1 className="font-parkinsans text-[2.5rem] font-semibold tracking-[-0.04em] text-white md:text-[2.85rem]">
                    Subscription
                  </h1>
                </section>

                {hasActivePremium ? (
                  <section className="mx-auto max-w-xl">
                    <PlanCard
                      badge="Current plan"
                      name={currentPlanName}
                      price={currentPrice}
                      cadence={currentCadence}
                      perks={premiumPlan.perks}
                      icon={<LuCrown className="h-5 w-5" />}
                      accentClassName="bg-[linear-gradient(180deg,rgba(244,63,94,0.07),rgba(255,255,255,0.03))]"
                    >
                      {isCancellationScheduled && cancellationDate ? (
                        <p className="mb-3 text-[13px] text-white/56">
                          Cancels on {cancellationDate}
                        </p>
                      ) : null}

                      {canCancel ? (
                        <button
                          type="button"
                          onClick={() => setShowCancelConfirm(true)}
                          className={`${appEntryActionButtonBaseClass} h-11 w-full rounded-[1.15rem] bg-red-500/12 px-5 text-sm font-semibold text-red-200 transition-colors duration-200 hover:bg-red-500/18`}
                        >
                          Cancel plan
                        </button>
                      ) : null}
                    </PlanCard>
                  </section>
                ) : (
                  <section className={subscriptionGridClassName}>
                    <PlanCard
                      badge="Current plan"
                      name={currentPlanName}
                      price={currentPrice}
                      cadence={currentCadence}
                      perks={freePlan.perks}
                      icon={<LuSparkles className="h-5 w-5" />}
                      accentClassName="bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.03))]"
                    />

                    <PlanCard
                      badge="Upgrade"
                      name={premiumPlan.name}
                      hideName
                      price={premiumPlan.price}
                      originalPrice={premiumPlan.originalPrice}
                      limitedPricing
                      cadence={premiumPlan.cadence}
                      perks={premiumPlan.perks}
                      icon={<LuCrown className="h-5 w-5" />}
                      accentClassName="bg-[linear-gradient(180deg,rgba(244,63,94,0.07),rgba(255,255,255,0.03))]"
                    >
                      <StartPremiumCheckoutButton
                        className="!h-11 w-full !rounded-[1.15rem] text-sm"
                        label="Upgrade to Premium"
                      />
                    </PlanCard>
                  </section>
                )}
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
          title="Cancel Premium?"
          message="Your Premium plan will stay active until the current billing period ends."
          cancelLabel="Keep plan"
          confirmLabel={isCancelling ? "Cancelling..." : "Cancel plan"}
          onCancel={() => setShowCancelConfirm(false)}
          onConfirm={handleCancelSubscription}
          confirmDisabled={isCancelling}
        />
      </Modal>
    </div>
  );
}
