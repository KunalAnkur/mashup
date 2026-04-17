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
    eyebrow: "Starter access",
    value: "$0",
    valueMeta: "Start anytime",
    description:
      "Best for casual watch parties, testing the room flow, and quick sessions with friends.",
    icon: LuSparkles,
    iconClassName: "bg-white/[0.06] text-white/78",
    badgeClassName: "bg-white/[0.05] text-white/72",
    cardClassName:
      "bg-white/[0.024] ring-1 ring-white/8 shadow-[0_22px_54px_rgba(0,0,0,0.18)]",
    features: [
      "6 people per room",
      "3 watch hours per session",
      "720p screen sharing",
      "Uploads up to 500 MB",
    ],
    ctaLabel: "Start free",
    ctaHref: "/",
  },
  {
    id: "premium",
    name: "Premium",
    eyebrow: "Best for creators and communities",
    value: "$9.99",
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
      "50 people per room",
      "Unlimited watch hours",
      "1080p screen sharing",
      "Recording, analytics, and branding",
    ],
    ctaLabel: "Upgrade to Premium",
    ctaHref: "/pricing",
  },
];

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
              <section className="mx-auto max-w-6xl space-y-8 pb-8 pt-6 md:space-y-10 md:pb-12 md:pt-10">
                <section className="mx-auto max-w-2xl text-center">
                  <div className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/68">
                    Pricing
                  </div>
                  <h1 className="mt-4 font-parkinsans text-3xl font-semibold leading-tight tracking-[-0.04em] text-white md:text-[3.4rem]">
                    Choose your plan
                  </h1>
                  <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-white/58 md:text-base md:leading-8">
                    Free is great for smaller rooms. Premium gives you bigger
                    rooms, longer sessions, and more polished hosting tools.
                  </p>
                </section>

                <section className="grid gap-5 xl:grid-cols-2">
                  {plans.map((plan) => {
                    const Icon = plan.icon;

                    return (
                      <article
                        key={plan.id}
                        className={`relative overflow-hidden rounded-[2rem] px-6 py-6 md:px-7 md:py-7 ${plan.cardClassName}`}
                      >
                        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/10" />

                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <span
                              className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] ${plan.badgeClassName}`}
                            >
                              {plan.name}
                            </span>
                            <p className="mt-4 text-sm font-medium text-white/42">
                              {plan.eyebrow}
                            </p>
                          </div>

                          <span
                            className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-[1.2rem] ${plan.iconClassName}`}
                          >
                            <Icon className="h-5 w-5" />
                          </span>
                        </div>

                        <div className="mt-8 flex items-end gap-3">
                          <span className="font-parkinsans text-[2.6rem] font-semibold leading-none tracking-[-0.05em] text-white md:text-[3rem]">
                            {plan.value}
                          </span>
                          <span className="pb-1.5 text-sm text-white/42">
                            {plan.valueMeta}
                          </span>
                        </div>

                        <p className="mt-4 max-w-[32rem] text-sm leading-7 text-white/60 md:text-[15px]">
                          {plan.description}
                        </p>

                        <ul className="mt-8 space-y-3.5">
                          {plan.features.map((feature) => (
                            <li
                              key={feature}
                              className="flex items-start gap-3 text-sm leading-6 text-white/72 md:text-[15px]"
                            >
                              <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-white/[0.05] text-white/78">
                                <LuCheck className="h-3.5 w-3.5" />
                              </span>
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>

                        <div className="mt-8">
                          {plan.id === "premium" ? (
                            <StartPremiumCheckoutButton
                              className="w-full font-parkinsans"
                              label={plan.ctaLabel}
                            />
                          ) : (
                            <Link
                              href={plan.ctaHref}
                              className={`${appEntryActionButtonBaseClass} ${appEntrySecondaryButtonClass} w-full font-parkinsans`}
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
