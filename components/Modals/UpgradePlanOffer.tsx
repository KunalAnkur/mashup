"use client";

import { LuArrowRight, LuCheck, LuShieldCheck } from "react-icons/lu";
import { useTranslations } from "@/i18n/I18nProvider";
import { useGetSubscriptionPlansQuery } from "@/lib/store/api/subscriptionPlanApi";
import { trackUpgradeClicked, type UpgradePromptContext } from "@/lib/analytics";
import { SubscriptionTier, type SubscriptionPlan } from "@/types/subscriptionTypes";
import { formatPlanPrice } from "@/utils/subscription";
import {
  appEntryActionButtonBaseClass,
  appEntryPrimaryButtonClass,
  pricingSavingsBadgeClass,
  upgradeOfferSurfaceClass,
} from "@/components/UI/classTokens";

export type UpgradeOfferTier = SubscriptionTier.COUPLE | SubscriptionTier.CROWD;

/** Which benefit leads the list — the one that answers what the person just ran into. */
export type UpgradeOfferLead = "watch_time" | "calls" | "games" | "people";

interface UpgradePlanOfferProps {
  tier: UpgradeOfferTier;
  lead: UpgradeOfferLead;
  context: UpgradePromptContext;
  roomId?: string | null;
  /** Called after a plan is opened, so the modal around this can close itself. */
  onChosen?: () => void;
}

/**
 * One plan, priced, with a button that goes straight to its checkout.
 *
 * Every upgrade prompt used to say "See plans" and open the full price list, so someone whose
 * film had just stopped did not know whether this cost $3 or $30, and still had a plan to
 * pick and a second button to press. This shows the plan that fixes what they hit — yearly
 * first, monthly one line below — and opens `/pricing?plan=<slug>`, which starts that plan's
 * checkout (or sign-in) on arrival.
 *
 * Still a new tab: every caller is inside a live room, and leaving it would drop the host
 * out of the watch party they are paying to continue.
 */
export default function UpgradePlanOffer({
  tier,
  lead,
  context,
  roomId,
  onChosen,
}: UpgradePlanOfferProps) {
  const t = useTranslations("room.upgrade");
  const tPricing = useTranslations("pricing");
  const { data: plans } = useGetSubscriptionPlansQuery();

  const yearly = plans?.find((p) => p.tier === tier && p.billing_cycle === "yearly");
  const monthly = plans?.find((p) => p.tier === tier && p.billing_cycle === "monthly");

  const openPlan = (slug?: string) => {
    trackUpgradeClicked(context, roomId, slug);
    const href = slug ? `/pricing?plan=${encodeURIComponent(slug)}` : "/pricing";
    window.open(href, "_blank", "noopener,noreferrer");
    onChosen?.();
  };

  // Catalog not loaded (or unreachable): no price to show, so fall back to the price list
  // rather than a button that cannot say what it costs.
  const featured = yearly ?? monthly;
  if (!featured) {
    return (
      <button
        type="button"
        onClick={() => openPlan()}
        className={`${appEntryActionButtonBaseClass} ${appEntryPrimaryButtonClass} w-full`}
      >
        <span>{t("upgradeNow")}</span>
        <LuArrowRight className="text-base" />
      </button>
    );
  }

  const benefits = benefitsFor(featured, lead, t, tPricing);
  const perMonth = featured.monthly_equivalent_price ?? featured.price;
  const isYearly = featured.billing_cycle === "yearly";

  return (
    <div>
      <div className={upgradeOfferSurfaceClass}>
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-semibold text-white">
            {tPricing(tier === SubscriptionTier.CROWD ? "crowd.name" : "couple.name")}
          </span>
          {isYearly && featured.savings_percent ? (
            <span className={pricingSavingsBadgeClass}>
              {tPricing("savePercent", { percent: featured.savings_percent })}
            </span>
          ) : null}
        </div>

        <div className="mt-2 flex items-end gap-2">
          {featured.compare_at_monthly_price != null && (
            <span className="pb-0.5 font-parkinsans text-lg font-semibold leading-none text-white/30 line-through">
              {formatPlanPrice(featured.compare_at_monthly_price, featured.currency)}
            </span>
          )}
          <span className="font-parkinsans text-[28px] font-semibold leading-none tracking-[-0.04em] text-white">
            {formatPlanPrice(perMonth, featured.currency)}
          </span>
          <span className="pb-0.5 text-xs text-white/50">{tPricing("perMonth")}</span>
        </div>
        {isYearly && (
          <p className="mt-1 text-[11px] text-white/45">
            {tPricing("billedYearly", {
              amount: formatPlanPrice(featured.billed_amount ?? featured.price, featured.currency),
            })}
          </p>
        )}

        <ul className="mt-3.5 space-y-2">
          {benefits.map((benefit, index) => (
            <li
              key={benefit}
              className={`flex items-start gap-2 text-xs leading-relaxed ${
                index === 0 ? "font-semibold text-white" : "text-white/75"
              }`}
            >
              <span
                className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
                  index === 0
                    ? "bg-gradient-to-br from-rose-500 to-fuchsia-500 text-white"
                    : "bg-white/[0.06] text-pink-300"
                }`}
              >
                <LuCheck size={10} strokeWidth={3} />
              </span>
              <span>{benefit}</span>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={() => openPlan(featured.slug)}
          className={`${appEntryActionButtonBaseClass} ${appEntryPrimaryButtonClass} mt-4 h-11 w-full`}
        >
          <span>{isYearly ? t("continueYearly") : t("continueMonthly")}</span>
          <LuArrowRight className="text-base" />
        </button>

        {isYearly && monthly && (
          <button
            type="button"
            onClick={() => openPlan(monthly.slug)}
            className="mt-2 w-full rounded-xl py-1.5 text-xs font-medium text-white/60 transition-colors hover:text-white"
          >
            {t("payMonthly", { price: formatPlanPrice(monthly.price, monthly.currency) })}
          </button>
        )}
      </div>

      <p className="mt-3 text-center text-[11px] leading-4 text-white/45">
        {/* Inline, so it stays with the first word when the line wraps on a phone. */}
        <LuShieldCheck className="me-1 inline h-3.5 w-3.5 align-[-3px] text-emerald-300/80" />
        {tPricing("reassurance")}
      </p>
    </div>
  );
}

type Translate = ReturnType<typeof useTranslations>;

/**
 * The plan's benefits, led by the one that fixes what the person just hit. Built from the
 * plan's own features so a number (room size, share quality) can never drift from guardian.
 * No "more people" line for Couple: it holds two, the same as Free.
 */
function benefitsFor(
  plan: SubscriptionPlan,
  lead: UpgradeOfferLead,
  t: Translate,
  tPricing: Translate,
): string[] {
  const { features } = plan;
  const all: Record<UpgradeOfferLead | "quality", string | null> = {
    watch_time: features.max_watch_minutes_per_day === -1 ? tPricing("noDailyLimit") : null,
    calls: t("benefits.videoCalls"),
    games: tPricing("everyGame"),
    people:
      plan.tier === SubscriptionTier.CROWD
        ? tPricing("crowd.features.participants", { count: features.max_room_participants })
        : null,
    quality: features.screen_share_quality
      ? tPricing("couple.features.screenShare", { quality: features.screen_share_quality })
      : null,
  };

  const order: (UpgradeOfferLead | "quality")[] = [lead, "people", "watch_time", "calls", "games", "quality"];
  const seen = new Set<string>();
  return order
    .map((key) => all[key])
    .filter((text): text is string => {
      if (!text || seen.has(text)) return false;
      seen.add(text);
      return true;
    })
    .slice(0, 4);
}
