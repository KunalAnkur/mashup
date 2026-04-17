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
    "6 people per room",
    "3 watch hours per session",
    "720p screen sharing",
  ],
};

const premiumPlan = {
  name: "Premium",
  price: "$9.99",
  cadence: "/month",
  perks: [
    "50 people per room",
    "Unlimited watch hours",
    "Recording, analytics, and branding",
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

type PlanCardProps = {
  badge: string;
  name: string;
  price: string;
  cadence: string;
  perks: string[];
  icon: React.ReactNode;
  accentClassName: string;
  children?: React.ReactNode;
};

function PlanCard({
  badge,
  name,
  price,
  cadence,
  perks,
  icon,
  accentClassName,
  children,
}: PlanCardProps) {
  return (
    <article
      className={`relative overflow-hidden rounded-[2rem] border border-white/10 px-6 py-6 shadow-[0_24px_80px_rgba(0,0,0,0.24)] md:px-7 md:py-7 ${accentClassName}`}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/10" />

      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="inline-flex items-center rounded-full bg-white/[0.05] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/68">
            {badge}
          </span>
          <h2 className="mt-5 font-parkinsans text-[2.35rem] font-semibold leading-none tracking-[-0.05em] text-white md:text-[2.75rem]">
            {name}
          </h2>
        </div>

        <span className="flex h-11 w-11 items-center justify-center rounded-[1.1rem] bg-white/[0.05] text-white/90">
          {icon}
        </span>
      </div>

      <div className="mt-6 flex items-end gap-2">
        <span className="font-parkinsans text-4xl font-semibold text-white md:text-5xl">
          {price}
        </span>
        <span className="pb-1.5 text-sm capitalize text-white/42">{cadence}</span>
      </div>

      <ul className="mt-6 space-y-3">
        {perks.map((perk) => (
          <li
            key={perk}
            className="flex items-center gap-3 text-sm leading-6 text-white/74"
          >
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/[0.05] text-white/80">
              <LuCheck className="h-3.5 w-3.5" />
            </span>
            <span>{perk}</span>
          </li>
        ))}
      </ul>

      {children ? <div className="mt-8">{children}</div> : null}
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
    } catch (cancelError: any) {
      const message =
        cancelError?.data?.message ||
        cancelError?.message ||
        "Unable to cancel your subscription right now.";
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
              <section className="mx-auto max-w-5xl space-y-6 pb-8 pt-8 md:space-y-8 md:pb-12 md:pt-12">
                <section className="mx-auto max-w-xl text-center">
                  <h1 className="font-parkinsans text-3xl font-semibold tracking-[-0.04em] text-white md:text-[3.1rem]">
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
                        <p className="mb-4 text-sm text-white/56">
                          Cancels on {cancellationDate}
                        </p>
                      ) : null}

                      {canCancel ? (
                        <button
                          type="button"
                          onClick={() => setShowCancelConfirm(true)}
                          className={`${appEntryActionButtonBaseClass} h-12 w-full rounded-2xl bg-red-500/12 px-5 text-sm font-semibold text-red-200 transition-colors duration-200 hover:bg-red-500/18`}
                        >
                          Cancel plan
                        </button>
                      ) : null}
                    </PlanCard>
                  </section>
                ) : (
                  <section className="grid gap-5 lg:grid-cols-2">
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
                      price={premiumPlan.price}
                      cadence={premiumPlan.cadence}
                      perks={premiumPlan.perks}
                      icon={<LuCrown className="h-5 w-5" />}
                      accentClassName="bg-[linear-gradient(180deg,rgba(244,63,94,0.07),rgba(255,255,255,0.03))]"
                    >
                      <StartPremiumCheckoutButton
                        className="w-full"
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
