/**
 * Subscription Types
 * Type definitions for subscription-related data
 */

export enum SubscriptionTier {
  FREE = 'free',
  /** @deprecated Use COUPLE instead. Kept so existing paying subscribers are never downgraded. */
  PREMIUM = 'premium',
  COUPLE = 'couple',
  CROWD = 'crowd'
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
  TRIAL = 'trial',
  PENDING = 'pending'
}

export enum BillingCycle {
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
  LIFETIME = 'lifetime'
}

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded'
}

export interface SubscriptionFeatures {
  max_room_participants: number;
  max_watch_hours_per_session: number; // -1 for unlimited
  // * bottom one is not in user
  max_concurrent_rooms: number;
  max_file_size_mb: number;
  max_watch_hours_per_month: number; // -1 for unlimited
  max_watch_minutes_per_day: number; // -1 for unlimited
  screen_share_quality: "720p" | "1080p" | "4k";
  can_record_sessions: boolean;
  priority_support: boolean;
  custom_room_branding: boolean;
  analytics_dashboard: boolean;
  ad_free_experience: boolean;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  tier: SubscriptionTier;
  price: number;
  currency: string;
  features: SubscriptionFeatures;
  billing_cycle: BillingCycle;
  display_order?: number;
  is_popular?: boolean;
  /**
   * Display figures computed by guardian (`getPublicPlanCatalog`). Deliberately not derived
   * here: costume and spotlight would each re-implement the arithmetic and drift, which is
   * how the old hardcoded "Save up to 30%" ended up contradicting the real 48%/28%.
   */
  monthly_equivalent_price?: number;
  compare_at_monthly_price?: number | null;
  savings_percent?: number | null;
  billed_amount?: number;
}

export interface PendingPlan {
  id: string;
  name: string;
  slug: string;
  tier: SubscriptionTier;
}

export interface UserSubscription {
  status: SubscriptionStatus;
  start_date: Date | string;
  tier: SubscriptionTier;
  end_date: Date | string | null;
  plan: SubscriptionPlan;
  pending_plan?: PendingPlan | null;
  pending_change_effective_at?: Date | string | null;
}

export interface SubscriptionState {
  subscription: UserSubscription | null;
  loading: boolean;
  error: string | null;
}

// Made with Bob
