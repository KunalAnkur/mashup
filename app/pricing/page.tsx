import type { Metadata } from "next";
import Link from "next/link";
import {
  LuArrowRight,
  LuCheck,
  LuCrown,
  LuSparkles,
} from "react-icons/lu";
import { EntryPageHeader } from "@/components/UI";
import StartPremiumCheckoutButton from "@/components/Billing/StartPremiumCheckoutButton";
import {
  appEntryActionButtonBaseClass,
  appEntryPageContentWrapClass,
  appEntryPageFixedHeaderOffsetClass,
  appEntryPageInsetClass,
  appEntryPageShellClass,
  appEntrySecondaryButtonClass,
  appFlexibleViewportPageClass,
} from "@/components/UI/classTokens";

export const metadata: Metadata = {
  title: "Pricing | Free and Premium Plans | Movmash",
  description:
    "Compare Movmash Free and Premium plans for room size, session length, uploads, and host tools.",
};

const plans = [
  {
    id: "free",
    name: "Free",
    hideName: false,
    limitedPricing: false,
    value: "$0",
    originalValue: null as string | null,
    valueMeta: "Start anytime",
    description:
      "Best for casual watch parties, testing the room flow, and quick sessions with friends.",
    icon: LuSparkles,
    iconClassName: "bg-white/[0.06] text-white/78",
    badgeClassName: "bg-white/[0.05] text-white/72",
    cardClassName:
      "bg-white/[0.024] ring-1 ring-white/8 shadow-[0_22px_54px_rgba(0,0,0,0.18)]",
    features: [
      "Small rooms — up to 2 people",
      "2-hour sessions",
      "Basic room UI",
    ],
    ctaLabel: "Start free",
    ctaHref: "/",
  },
  {
    id: "premium",
    name: "Premium",
    hideName: true,
    limitedPricing: true,
    value: "$2.99",
    originalValue: "$9.99",
    valueMeta: "per month",
    description:
      "Best for hosts who run bigger rooms, longer sessions, cleaner branding, and better control.",
    icon: LuCrown,
    iconClassName:
      "bg-gradient-to-br from-rose-500 via-pink-500 to-fuchsia-500 text-white shadow-[0_18px_36px_rgba(244,63,94,0.2)]",
    badgeClassName: "bg-rose-500/12 text-rose-100",
    cardClassName:
      "bg-[linear-gradient(180deg,rgba(244,63,94,0.07)_0%,rgba(255,255,255,0.03)_24%,rgba(255,255,255,0.022)_100%)] ring-1 ring-rose-400/20 shadow-[0_26px_64px_rgba(0,0,0,0.24)]",
    features: [
      "Large rooms — 50+ people",
      "Unlimited time",
      "Better room UI",
    ],
    ctaLabel: "Upgrade to Premium",
    ctaHref: "/pricing",
  },
];

const pricingGridClassName = "grid gap-4 md:grid-cols-2";
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

export default function PricingPage() {
  return (
    <div className={appFlexibleViewportPageClass}>
      <div className={appEntryPageShellClass}>
        <EntryPageHeader title="Pricing" fixed showBrandOnSubpage />

        <main
          className={`flex-1 overflow-y-auto overflow-x-hidden ${appEntryPageFixedHeaderOffsetClass}`}
        >
          <div className={appEntryPageInsetClass}>
            <div className={appEntryPageContentWrapClass}>
              <section className="mx-auto max-w-6xl space-y-6 pb-6 pt-4 md:space-y-7 md:pb-8 md:pt-7">
                <section className="mx-auto max-w-2xl text-center">
                  <div className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/68">
                    Pricing
                  </div>
                  <h1 className="mt-3.5 font-parkinsans text-[2.55rem] font-semibold leading-tight tracking-[-0.04em] text-white md:text-[3rem]">
                    Choose your plan
                  </h1>
                  <p className="mx-auto mt-2.5 max-w-xl text-[13px] leading-6 text-white/58 md:text-[15px] md:leading-7">
                    Free is great for smaller rooms. Premium gives you bigger
                    rooms, longer sessions, and more polished hosting tools.
                  </p>
                </section>

                <section className={pricingGridClassName}>
                  {plans.map((plan) => {
                    const Icon = plan.icon;

                    return (
                      <article
                        key={plan.id}
                        className={`${pricingCardClassName} ${plan.cardClassName}`}
                      >
                        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/10" />

                        <span className={`${pricingIconWrapClassName} ${plan.iconClassName} absolute right-5 top-5 sm:right-6 sm:top-6`}>
                          <Icon className="h-[18px] w-[18px]" />
                        </span>

                        {plan.limitedPricing && (
                          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-rose-500/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-rose-300">
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                            Limited pricing
                          </div>
                        )}

                        {!plan.hideName && (
                          <span className={`${pricingBadgeClassName} ${plan.badgeClassName}`}>
                            {plan.name}
                          </span>
                        )}

                        <div className={pricingValueRowClassName}>
                          <span className={pricingValueClassName}>
                            {plan.value}
                          </span>
                          <div className="flex flex-col gap-0.5 pb-1">
                            {plan.originalValue && (
                              <span className="text-[12px] font-medium leading-none text-white/36 line-through">
                                {plan.originalValue}
                              </span>
                            )}
                            <span className={pricingValueMetaClassName}>
                              {plan.valueMeta}
                            </span>
                          </div>
                        </div>

                        <p className={pricingDescriptionClassName}>
                          {plan.description}
                        </p>

                        <ul className={pricingFeaturesClassName}>
                          {plan.features.map((feature) => (
                            <li
                              key={feature}
                              className={pricingFeatureItemClassName}
                            >
                              <span className={pricingFeatureIconClassName}>
                                <LuCheck className="h-3 w-3" />
                              </span>
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>

                        <div className={pricingCtaWrapClassName}>
                          {plan.id === "premium" ? (
                            <StartPremiumCheckoutButton
                              className={pricingCtaClassName}
                              label={plan.ctaLabel}
                            />
                          ) : (
                            <Link
                              href={plan.ctaHref}
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
              </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
