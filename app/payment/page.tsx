import type { Metadata } from "next";
import Link from "next/link";
import {
  LuArrowRight,
  LuBadgeCheck,
  LuCalendarClock,
  LuCheck,
  LuCrown,
  LuFilm,
  LuLayoutDashboard,
  LuMonitorUp,
  LuShieldCheck,
  LuSparkles,
  LuUsers,
  LuX,
} from "react-icons/lu";
import { EntryPageHeader } from "@/components/UI";
import StartPremiumCheckoutButton from "@/components/Billing/StartPremiumCheckoutButton";
import {
  appEntryActionButtonBaseClass,
  appEntryPageContentWrapClass,
  appEntryPageFixedHeaderOffsetClass,
  appEntryPageInsetClass,
  appEntryPageShellClass,
  appEntryPrimaryButtonClass,
  appEntrySecondaryButtonClass,
  appFlexibleViewportPageClass,
  appSeparatorLineClass,
  appWhiteBorderClass,
} from "@/components/UI/classTokens";
import type { SubscriptionFeatures, SubscriptionPlan } from "@/types/subscription";

export const metadata: Metadata = {
  title: "Premium Subscription",
  description:
    "Explore Movmash Premium and compare room limits, watch hours, screen sharing quality, analytics, branding, and support.",
};

const plans: SubscriptionPlan[] = [
  {
    id: "free",
    name: "Free",
    label: "Starter access",
    price: "$0",
    cadence: "/month",
    summary: "For casual watch parties, testing the room flow, and quick sessions with friends.",
    cta: "Start Free",
    features: {
      max_room_participants: 6,
      max_watch_hours_per_session: 3,
      max_concurrent_rooms: 1,
      max_file_size_mb: 500,
      max_watch_hours_per_month: 20,
      screen_share_quality: "720p",
      can_record_sessions: false,
      priority_support: false,
      custom_room_branding: false,
      analytics_dashboard: false,
      ad_free_experience: false,
    },
  },
  {
    id: "premium",
    name: "Premium",
    label: "Best for creators and communities",
    price: "$9.99",
    cadence: "/month",
    summary: "For hosts who run serious sessions, bigger rooms, branded experiences, and longer watch time.",
    cta: "Upgrade to Premium",
    highlight: true,
    features: {
      max_room_participants: 50,
      max_watch_hours_per_session: -1,
      max_concurrent_rooms: 5,
      max_file_size_mb: 10240,
      max_watch_hours_per_month: -1,
      screen_share_quality: "1080p",
      can_record_sessions: true,
      priority_support: true,
      custom_room_branding: true,
      analytics_dashboard: true,
      ad_free_experience: true,
    },
  },
];

const capabilityRows: Array<{
  key: keyof SubscriptionFeatures;
  label: string;
  description: string;
  icon: React.ReactNode;
}> = [
  {
    key: "max_room_participants",
    label: "Room participants",
    description: "How many people can join the same watch room.",
    icon: <LuUsers className="text-base text-cyan-200" />,
  },
  {
    key: "max_watch_hours_per_session",
    label: "Watch hours per session",
    description: "How long one active room can run before limits apply.",
    icon: <LuCalendarClock className="text-base text-amber-200" />,
  },
  {
    key: "max_concurrent_rooms",
    label: "Concurrent rooms",
    description: "How many rooms you can host at the same time.",
    icon: <LuLayoutDashboard className="text-base text-pink-200" />,
  },
  {
    key: "max_file_size_mb",
    label: "Max file upload size",
    description: "Largest local file size supported for shared playback.",
    icon: <LuFilm className="text-base text-emerald-200" />,
  },
  {
    key: "max_watch_hours_per_month",
    label: "Monthly watch hours",
    description: "Total monthly hosted watch time available to your account.",
    icon: <LuCalendarClock className="text-base text-violet-200" />,
  },
  {
    key: "screen_share_quality",
    label: "Screen share quality",
    description: "Maximum quality available for live shared screens.",
    icon: <LuMonitorUp className="text-base text-sky-200" />,
  },
  {
    key: "can_record_sessions",
    label: "Session recording",
    description: "Save sessions for highlights, reviews, or internal playback.",
    icon: <LuShieldCheck className="text-base text-lime-200" />,
  },
  {
    key: "priority_support",
    label: "Priority support",
    description: "Faster support response when your room matters most.",
    icon: <LuBadgeCheck className="text-base text-orange-200" />,
  },
  {
    key: "custom_room_branding",
    label: "Custom branding",
    description: "Apply your own room visuals for teams, creators, or events.",
    icon: <LuSparkles className="text-base text-fuchsia-200" />,
  },
  {
    key: "analytics_dashboard",
    label: "Analytics dashboard",
    description: "View usage patterns, room activity, and host behavior.",
    icon: <LuLayoutDashboard className="text-base text-rose-200" />,
  },
  {
    key: "ad_free_experience",
    label: "Ad-free experience",
    description: "Run sessions without product interruptions around the core flow.",
    icon: <LuCrown className="text-base text-yellow-200" />,
  },
];

function formatFeatureValue(
  key: keyof SubscriptionFeatures,
  value: SubscriptionFeatures[keyof SubscriptionFeatures],
) {
  if (typeof value === "boolean") {
    return value ? (
      <span className="inline-flex items-center gap-1.5 text-emerald-300">
        <LuCheck className="text-sm" />
        <span>Included</span>
      </span>
    ) : (
      <span className="inline-flex items-center gap-1.5 text-white/35">
        <LuX className="text-sm" />
        <span>Not included</span>
      </span>
    );
  }

  if (
    key === "max_watch_hours_per_session" ||
    key === "max_watch_hours_per_month"
  ) {
    return value === -1 ? "Unlimited" : `${value} hours`;
  }

  if (key === "max_file_size_mb") {
    const sizeInMb = value as number;
    return sizeInMb >= 1024
      ? `${Math.round(sizeInMb / 1024)} GB`
      : `${sizeInMb} MB`;
  }

  if (key === "screen_share_quality") {
    return String(value).toUpperCase();
  }

  return String(value);
}

const PaymentPage = () => {
  return (
    <div className={appFlexibleViewportPageClass}>
      <div className={appEntryPageShellClass}>
        <EntryPageHeader title="Premium" fixed showBrandOnSubpage />

        <main
          className={`flex-1 overflow-y-auto overflow-x-hidden ${appEntryPageFixedHeaderOffsetClass}`}
        >
          <div className={appEntryPageInsetClass}>
            <div className={appEntryPageContentWrapClass}>
              <section className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(255,196,0,0.14),transparent_26%),radial-gradient(circle_at_top_right,rgba(244,63,94,0.18),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.03))] px-5 py-6 shadow-[0_24px_90px_rgba(0,0,0,0.35)] sm:px-8 sm:py-8 lg:px-10 lg:py-10">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />
                <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
                  <div className="max-w-3xl">
                    <div className="inline-flex items-center gap-2 rounded-full border border-yellow-300/20 bg-yellow-300/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-yellow-100/90">
                      <LuCrown className="text-sm" />
                      Premium subscription
                    </div>
                    <h1 className="mt-4 max-w-2xl text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
                      Upgrade your watch rooms from casual hangs to polished hosted experiences.
                    </h1>
                    <p className="mt-4 max-w-2xl text-sm leading-7 text-white/70 sm:text-base">
                      Movmash Premium is designed for creators, community leaders, and teams that
                      need bigger rooms, longer sessions, better screen quality, and cleaner control
                      over the audience experience.
                    </p>

                    <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                      <Link
                        href="/stream"
                        className={`${appEntryActionButtonBaseClass} ${appEntryPrimaryButtonClass} min-w-[190px]`}
                      >
                        <span>Try premium workflow</span>
                        <LuArrowRight className="text-base" />
                      </Link>
                      <Link
                        href="/"
                        className={`${appEntryActionButtonBaseClass} ${appEntrySecondaryButtonClass} min-w-[190px]`}
                      >
                        <span>Back to home</span>
                      </Link>
                    </div>
                  </div>

                  <div className="grid gap-3 rounded-[28px] border border-white/10 bg-black/20 p-4 backdrop-blur-xl sm:grid-cols-3 lg:grid-cols-1">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-white/45">
                        Premium room size
                      </p>
                      <p className="mt-2 text-3xl font-semibold text-white">50</p>
                      <p className="mt-1 text-sm text-white/60">participants in a single room</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-white/45">
                        Session limits
                      </p>
                      <p className="mt-2 text-3xl font-semibold text-white">Unlimited</p>
                      <p className="mt-1 text-sm text-white/60">watch hours for serious sessions</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-white/45">
                        Share quality
                      </p>
                      <p className="mt-2 text-3xl font-semibold text-white">4K</p>
                      <p className="mt-1 text-sm text-white/60">high-fidelity screen sharing</p>
                    </div>
                  </div>
                </div>
              </section>

              <section className="mt-8 grid gap-5 xl:grid-cols-2">
                {plans.map((plan) => (
                  <article
                    key={plan.id}
                    className={`relative overflow-hidden rounded-[28px] p-5 sm:p-6 ${
                      plan.highlight
                        ? "border border-rose-300/30 bg-[radial-gradient(circle_at_top,rgba(251,191,36,0.14),transparent_28%),linear-gradient(135deg,rgba(255,255,255,0.09),rgba(255,255,255,0.04))] shadow-[0_22px_70px_rgba(225,29,72,0.18)]"
                        : `${appWhiteBorderClass} bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.03))]`
                    }`}
                  >
                    {plan.highlight ? (
                      <div className="absolute right-4 top-4 rounded-full bg-gradient-to-r from-amber-300 to-rose-300 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-black">
                        Recommended
                      </div>
                    ) : null}

                    <div className="max-w-xl">
                      <p className="text-xs uppercase tracking-[0.24em] text-white/45">{plan.label}</p>
                      <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">
                        {plan.name}
                      </h2>
                      <div className="mt-3 flex items-end gap-1">
                        <span className="text-4xl font-semibold text-white">{plan.price}</span>
                        <span className="pb-1 text-sm text-white/55">{plan.cadence}</span>
                      </div>
                      <p className="mt-3 text-sm leading-7 text-white/68">{plan.summary}</p>
                    </div>

                    <div className={`my-5 ${appSeparatorLineClass}`} />

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl bg-white/[0.045] p-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-white/45">Rooms</p>
                        <p className="mt-2 text-xl font-semibold text-white">
                          {plan.features.max_concurrent_rooms} concurrent
                        </p>
                        <p className="mt-1 text-sm text-white/55">
                          Up to {plan.features.max_room_participants} people per room
                        </p>
                      </div>
                      <div className="rounded-2xl bg-white/[0.045] p-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-white/45">Media</p>
                        <p className="mt-2 text-xl font-semibold text-white">
                          {formatFeatureValue("screen_share_quality", plan.features.screen_share_quality)}
                        </p>
                        <p className="mt-1 text-sm text-white/55">
                          Uploads up to {formatFeatureValue("max_file_size_mb", plan.features.max_file_size_mb)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                      {[
                        plan.features.can_record_sessions && "Recording",
                        plan.features.priority_support && "Priority support",
                        plan.features.custom_room_branding && "Custom branding",
                        plan.features.analytics_dashboard && "Analytics",
                        plan.features.ad_free_experience && "Ad-free",
                      ]
                        .filter((tag): tag is string => Boolean(tag))
                        .map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs text-white/75"
                          >
                            {tag}
                          </span>
                        ))}
                    </div>

                    {plan.id === "premium" ? (
                      <StartPremiumCheckoutButton
                        className="mt-6"
                        label="Upgrade to Premium"
                      />
                    ) : (
                      <Link
                        href="/"
                        className={`${appEntryActionButtonBaseClass} ${appEntrySecondaryButtonClass} mt-6 w-full`}
                      >
                        <span>{plan.cta}</span>
                        <LuArrowRight className="text-base" />
                      </Link>
                    )}
                  </article>
                ))}
              </section>

              <section className="mt-8 rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.03))] p-5 sm:p-6 lg:p-8">
                <div className="max-w-2xl">
                  <p className="text-xs uppercase tracking-[0.24em] text-white/45">Feature breakdown</p>
                  <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                    Everything premium unlocks, side by side.
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-white/64">
                    This route explains the subscription clearly today. When your checkout flow is ready,
                    the Premium CTA can point directly at the purchase action without changing the rest of the page.
                  </p>
                </div>

                <div className="mt-6 overflow-hidden rounded-[24px] border border-white/10 bg-black/15">
                  <div className="grid grid-cols-[1.25fr_0.9fr_0.9fr] border-b border-white/10 bg-white/[0.04] px-4 py-4 text-sm font-semibold text-white sm:px-6">
                    <div>Capability</div>
                    <div>Free</div>
                    <div>Premium</div>
                  </div>

                  <div className="divide-y divide-white/8">
                    {capabilityRows.map((row) => (
                      <div
                        key={row.key}
                        className="grid grid-cols-1 gap-4 px-4 py-4 sm:grid-cols-[1.25fr_0.9fr_0.9fr] sm:px-6"
                      >
                        <div className="pr-4">
                          <div className="flex items-center gap-3">
                            <span className="flex h-9 w-9 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
                              {row.icon}
                            </span>
                            <div>
                              <p className="text-sm font-semibold text-white">{row.label}</p>
                              <p className="mt-1 text-xs leading-6 text-white/52">{row.description}</p>
                            </div>
                          </div>
                        </div>

                        <div className="text-sm font-medium text-white/76 sm:self-center">
                          {formatFeatureValue(row.key, plans[0].features[row.key])}
                        </div>

                        <div className="text-sm font-medium text-white sm:self-center">
                          {formatFeatureValue(row.key, plans[1].features[row.key])}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default PaymentPage;
