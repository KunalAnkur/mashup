/**
 * Subscription Types
 * Type definitions for subscription-related data
 */

export enum SubscriptionTier {
  FREE = 'free',
  PREMIUM = 'premium'
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

export interface SubscriptionFeatures {
  max_room_participants: number;
  max_watch_hours_per_session: number; // -1 for unlimited
  // * bottom one is not in user
  max_concurrent_rooms: number;
  max_file_size_mb: number;
  max_watch_hours_per_month: number; // -1 for unlimited
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
  price: number;
  currency: string;
  features: SubscriptionFeatures;
  billing_cycle: BillingCycle;
}

export interface UserSubscription {
  status: SubscriptionStatus;
  start_date: Date | string;
  tier: SubscriptionTier;
  end_date: Date | string | null;
  plan: SubscriptionPlan;
}

export interface SubscriptionState {
  subscription: UserSubscription | null;
  loading: boolean;
  error: string | null;
}

// Made with Bob
