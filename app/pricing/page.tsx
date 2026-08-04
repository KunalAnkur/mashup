"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { LuArrowRight, LuCheck, LuHeart, LuSparkles, LuUsers } from "react-icons/lu";
import { EntryPageHeader } from "@/components/UI";
import StartPremiumCheckoutButton from "@/components/Billing/StartPremiumCheckoutButton";
import PlanChangeConfirmModal from "@/components/Billing/PlanChangeConfirmModal";
import { useTranslations } from "@/i18n/I18nProvider";
import { useGetSubscriptionPlansQuery } from "@/lib/store/api/subscriptionPlanApi";
import { useGetMySubscriptionQuery } from "@/lib/store/api/userApi";
import { formatPlanPrice, hasActivePaidSubscription } from "@/utils/subscription";
import { SubscriptionTier } from "@/types/subscriptionTypes";
import {
  appEntryActionButtonBaseClass,
  appEntryPageContentWrapClass,
  appEntryPageFixedHeaderOffsetClass,
  appEntryPageInsetClass,
  appEntryPageShellClass,
  appEntrySecondaryButtonClass,
  appFlexibleViewportPageClass,
  appPulseSurfaceClass,
  pricingPaidBadgeSurfaceClass,
  pricingPaidCardSurfaceClass,
  pricingPaidIconSurfaceClass,
} from "@/components/UI/classTokens";

type BillingCycle = "monthly" | "yearly";

const pricingGridClassName = "grid gap-4 lg:grid-cols-3";
const pricingCardClassName =
  "relative overflow-hidden rounded-[2rem] px-5 py-5 sm:px-6 sm:py-6";
const pricingBadgeClassName =
  "inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.22em]";
const pricingIconWrapClassName =
  "flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[1.1rem]";
const pricingValueRowClassName = "mt-6 flex items-end gap-2.5";
const pricingValueClassName =
  "font-parkinsans text-[2.35rem] font-semibold leading-none tracking-[-0.05em] text-white md:text-[2.7rem]";
const pricingValueMetaClassName = "pb-1 text-[13px] text-white/42";
const pricingDescriptionClassName =
  "mt-3 max-w-[30rem] text-[13px] leading-6 text-white/60 md:text-sm md:leading-6";
const pricingFeaturesClassName = "mt-6 space-y-2.5";
const pricingFeatureItemClassName =
  "flex items-start gap-3 text-[13px] leading-5 text-white/72 md:text-sm md:leading-6";
const pricingFeatureIconClassName =
  "mt-0.5 flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded-full bg-white/[0.05] text-white/78";
const pricingCtaWrapClassName = "mt-6";
const pricingCtaClassName =
  "!h-11 w-full !rounded-[1.15rem] text-sm font-parkinsans";

const freeCardClassName =
  "bg-white/[0.024] ring-1 ring-white/8 shadow-[0_22px_54px_rgba(0,0,0,0.18)]";
const freeIconClassName = "bg-white/[0.06] text-white/78";
const freeBadgeClassName = "bg-white/[0.05] text-white/72";

const coupleCardClassName = pricingPaidCardSurfaceClass;
const crowdCardClassName = `${pricingPaidCardSurfaceClass} ring-2`;

const billingToggleShellClassName =
  "mx-auto inline-flex items-center gap-1 rounded-full bg-white/[0.04] p-1";
const billingToggleButtonClassName =
  "rounded-full px-4 py-1.5 text-[13px] font-medium transition-colors duration-200";
const billingToggleActiveClassName =
  "bg-gradient-to-r from-rose-600 via-pink-600 to-fuchsia-600 text-white";
const billingToggleInactiveClassName = "text-white/56 hover:text-white/80";

const skeletonCardClassName = `${pricingCardClassName} ${appPulseSurfaceClass} h-[420px]`;

export default function PricingPage() {
  const t = useTranslations("pricing");
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const { data: catalogPlans, isLoading, isError } = useGetSubscriptionPlansQuery();
  const { data: mySubscription } = useGetMySubscriptionQuery();
  const [changeTarget, setChangeTarget] = useState<{ slug: string; name: string } | null>(null);

  const subscription = mySubscription?.data;
  const isOnPaidPlan = hasActivePaidSubscription(subscription);
  const currentPlanSlug = subscription?.plan?.slug;

  const freePlan = catalogPlans?.find((p) => p.tier === SubscriptionTier.FREE);
  const couplePlan = catalogPlans?.find(
    (p) => p.tier === SubscriptionTier.COUPLE && p.billing_cycle === billingCycle,
  );
  const crowdPlan = catalogPlans?.find(
    (p) => p.tier === SubscriptionTier.CROWD && p.billing_cycle === billingCycle,
  );

  const plans = useMemo(() => {
    if (!freePlan || !couplePlan || !crowdPlan) return [];

    const periodLabel = billingCycle === "monthly" ? t("perMonth") : t("perYear");

    return [
      {
        id: "free",
        slug: freePlan.slug,
        name: t("free.name"),
        hideName: false,
        value: formatPlanPrice(freePlan.price, freePlan.currency),
        valueMeta: t("free.meta"),
        description: t("free.description"),
        icon: LuSparkles,
        iconClassName: freeIconClassName,
        badgeClassName: freeBadgeClassName,
        cardClassName: freeCardClassName,
        features: [
          t("free.features.participants", { count: freePlan.features.max_room_participants }),
          t("free.features.dailyLimit", { minutes: freePlan.features.max_watch_minutes_per_day }),
          t("free.features.screenShare", { quality: freePlan.features.screen_share_quality }),
        ],
        ctaLabel: t("free.cta"),
        isPaid: false as const,
      },
      {
        id: "couple",
        slug: couplePlan.slug,
        name: t("couple.name"),
        hideName: false,
        value: formatPlanPrice(couplePlan.price, couplePlan.currency),
        valueMeta: periodLabel,
        description: t("couple.description"),
        icon: LuHeart,
        iconClassName: pricingPaidIconSurfaceClass,
        badgeClassName: pricingPaidBadgeSurfaceClass,
        cardClassName: coupleCardClassName,
        features: [
          t("couple.features.videoCall"),
          t("couple.features.participants", { count: couplePlan.features.max_room_participants }),
          t("couple.features.unlimitedWatch"),
          t("couple.features.screenShare", { quality: couplePlan.features.screen_share_quality }),
          t("couple.features.adFree"),
        ],
        ctaLabel: t("couple.cta"),
        isPaid: true as const,
      },
      {
        id: "crowd",
        slug: crowdPlan.slug,
        name: t("crowd.name"),
        hideName: false,
        value: formatPlanPrice(crowdPlan.price, crowdPlan.currency),
        valueMeta: periodLabel,
        description: t("crowd.description"),
        icon: LuUsers,
        iconClassName: pricingPaidIconSurfaceClass,
        badgeClassName: pricingPaidBadgeSurfaceClass,
        cardClassName: crowdCardClassName,
        features: [
          t("crowd.features.videoCall"),
          t("crowd.features.participants", { count: crowdPlan.features.max_room_participants }),
          t("crowd.features.unlimitedWatch"),
          t("crowd.features.screenShare", { quality: crowdPlan.features.screen_share_quality }),
          t("crowd.features.adFree"),
        ],
        ctaLabel: t("crowd.cta"),
        isPaid: true as const,
      },
    ];
  }, [billingCycle, couplePlan, crowdPlan, freePlan, t]);

  return (
    <div className={appFlexibleViewportPageClass}>
      <div className={appEntryPageShellClass}>
        <EntryPageHeader title={t("kicker")} fixed showBrandOnSubpage />

        <main
          className={`flex-1 overflow-y-auto overflow-x-hidden ${appEntryPageFixedHeaderOffsetClass}`}
        >
          <div className={appEntryPageInsetClass}>
            <div className={appEntryPageContentWrapClass}>
              <section className="mx-auto max-w-6xl space-y-6 pb-6 pt-4 md:space-y-7 md:pb-8 md:pt-7">
                <section className="mx-auto max-w-2xl text-center">
                  <div className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/68">
                    {t("kicker")}
                  </div>
                  <h1 className="mt-3.5 font-parkinsans text-[2.55rem] font-semibold leading-tight tracking-[-0.04em] text-white md:text-[3rem]">
                    {t("title")}
                  </h1>
                  <p className="mx-auto mt-2.5 max-w-xl text-[13px] leading-6 text-white/58 md:text-[15px] md:leading-7">
                    {t("subtitle")}
                  </p>

                  <div className="mt-5 flex flex-col items-center gap-2">
                    <div className={billingToggleShellClassName}>
                      <button
                        type="button"
                        onClick={() => setBillingCycle("monthly")}
                        className={`${billingToggleButtonClassName} ${
                          billingCycle === "monthly"
                            ? billingToggleActiveClassName
                            : billingToggleInactiveClassName
                        }`}
                      >
                        {t("billingToggle.monthly")}
                      </button>
                      <button
                        type="button"
                        onClick={() => setBillingCycle("yearly")}
                        className={`${billingToggleButtonClassName} ${
                          billingCycle === "yearly"
                            ? billingToggleActiveClassName
                            : billingToggleInactiveClassName
                        }`}
                      >
                        {t("billingToggle.yearly")}
                      </button>
                    </div>
                    {billingCycle === "yearly" && (
                      <span className="text-[11px] font-medium text-rose-300">
                        {t("billingToggle.yearlySavings")}
                      </span>
                    )}
                    {/* Say what a yearly plan actually commits you to before checkout, not
                        after (MOVMASH.md D3). */}
                    <span className="text-[11px] leading-relaxed text-white/44">
                      {billingCycle === "yearly"
                        ? t("billingToggle.yearlyTerms")
                        : t("billingToggle.monthlyTerms")}
                    </span>
                  </div>
                </section>

                {isError && (
                  <p className="text-center text-sm text-white/56">{t("loadError")}</p>
                )}

                {isLoading || plans.length === 0 ? (
                  <section className={pricingGridClassName} aria-hidden={!isLoading}>
                    {[0, 1, 2].map((i) => (
                      <div key={i} className={skeletonCardClassName} />
                    ))}
                  </section>
                ) : (
                  <section className={pricingGridClassName}>
                    {plans.map((plan) => {
                      const Icon = plan.icon;

                      return (
                        <article
                          key={plan.id}
                          className={`${pricingCardClassName} ${plan.cardClassName}`}
                        >
                          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/10" />

                          <span
                            className={`${pricingIconWrapClassName} ${plan.iconClassName} absolute right-5 top-5 sm:right-6 sm:top-6`}
                          >
                            <Icon className="h-[18px] w-[18px]" />
                          </span>

                          {!plan.hideName && (
                            <span className={`${pricingBadgeClassName} ${plan.badgeClassName}`}>
                              {plan.name}
                            </span>
                          )}

                          <div className={pricingValueRowClassName}>
                            <span className={pricingValueClassName}>{plan.value}</span>
                            <div className="flex flex-col gap-0.5 pb-1">
                              <span className={pricingValueMetaClassName}>
                                {plan.valueMeta}
                              </span>
                            </div>
                          </div>

                          <p className={pricingDescriptionClassName}>{plan.description}</p>

                          <ul className={pricingFeaturesClassName}>
                            {plan.features.map((feature) => (
                              <li key={feature} className={pricingFeatureItemClassName}>
                                <span className={pricingFeatureIconClassName}>
                                  <LuCheck className="h-3 w-3" />
                                </span>
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>

                          <div className={pricingCtaWrapClassName}>
                            {plan.slug === currentPlanSlug ? (
                              <span
                                className={`${appEntryActionButtonBaseClass} ${appEntrySecondaryButtonClass} ${pricingCtaClassName} !cursor-default opacity-70`}
                              >
                                {t("currentPlanLabel")}
                              </span>
                            ) : isOnPaidPlan && !plan.isPaid ? (
                              // Moving to Free isn't a Dodo plan change (Free has no Dodo
                              // product) — it's a cancellation. Send them to /subscription,
                              // which already has the real cancel flow.
                              <Link
                                href="/subscription"
                                className={`${appEntryActionButtonBaseClass} ${appEntrySecondaryButtonClass} ${pricingCtaClassName}`}
                              >
                                <span>{t("downgradeToFreeLabel")}</span>
                                <LuArrowRight className="text-base" />
                              </Link>
                            ) : isOnPaidPlan ? (
                              <button
                                type="button"
                                onClick={() => setChangeTarget({ slug: plan.slug, name: plan.name })}
                                className={`${appEntryActionButtonBaseClass} ${appEntrySecondaryButtonClass} ${pricingCtaClassName}`}
                              >
                                <span>{t("switchPlanLabel")}</span>
                                <LuArrowRight className="text-base" />
                              </button>
                            ) : plan.isPaid ? (
                              <StartPremiumCheckoutButton
                                className={pricingCtaClassName}
                                label={plan.ctaLabel}
                                planSlug={plan.slug}
                                planName={plan.name}
                              />
                            ) : (
                              <Link
                                href="/"
                                className={`${appEntryActionButtonBaseClass} ${appEntrySecondaryButtonClass} ${pricingCtaClassName}`}
                              >
                                <span>{plan.ctaLabel}</span>
                                <LuArrowRight className="text-base" />
                              </Link>
                            )}
                          </div>
                        </article>
                      );
                    })}
                  </section>
                )}
              </section>
            </div>
          </div>
        </main>
      </div>

      <PlanChangeConfirmModal
        open={!!changeTarget}
        onClose={() => setChangeTarget(null)}
        targetPlanSlug={changeTarget?.slug ?? null}
        targetPlanName={changeTarget?.name ?? ""}
      />
    </div>
  );
}
