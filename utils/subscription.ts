import {
  SubscriptionStatus,
  SubscriptionTier,
  UserSubscription,
} from "@/types/subscriptionTypes";

const PAID_TIERS = [
  SubscriptionTier.PREMIUM,
  SubscriptionTier.COUPLE,
  SubscriptionTier.CROWD,
];

export function isPaidTier(tier?: SubscriptionTier | null): boolean {
  return !!tier && PAID_TIERS.includes(tier);
}

export function hasActivePaidSubscription(
  subscription?: UserSubscription | null,
): boolean {
  if (!subscription || !isPaidTier(subscription.tier)) return false;
  if (subscription.status === SubscriptionStatus.EXPIRED) return false;

  if (subscription.status === SubscriptionStatus.CANCELLED) {
    // "Cancelled" means auto-renew is off, not that access has ended — a cancel-at-period-end
    // subscriber keeps real access (and a real Dodo subscription to switch plans on) until end_date.
    if (!subscription.end_date) return false;
    return new Date(subscription.end_date).getTime() > Date.now();
  }

  return true;
}

const TIER_DISPLAY_NAME: Partial<Record<SubscriptionTier, string>> = {
  [SubscriptionTier.PREMIUM]: "Premium",
  [SubscriptionTier.COUPLE]: "Couple",
  [SubscriptionTier.CROWD]: "Crowd",
};

export function getTierDisplayName(tier?: SubscriptionTier | null): string {
  return (tier && TIER_DISPLAY_NAME[tier]) || "Premium";
}

export function formatPlanPrice(price?: number | null, currency?: string | null): string {
  if (typeof price !== "number" || Number.isNaN(price)) {
    return "";
  }

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: (currency || "USD").toUpperCase(),
      maximumFractionDigits: price % 1 === 0 ? 0 : 2,
    }).format(price);
  } catch {
    return `$${price.toFixed(2)}`;
  }
}
