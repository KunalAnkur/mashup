export interface SubscriptionFeatures {
  max_room_participants: number;
  max_watch_hours_per_session: number;
  max_concurrent_rooms: number;
  max_file_size_mb: number;
  max_watch_hours_per_month: number;
  screen_share_quality: "480p" | "720p" | "1080p" | "4k";
  can_record_sessions: boolean;
  priority_support: boolean;
  custom_room_branding: boolean;
  analytics_dashboard: boolean;
  ad_free_experience: boolean;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  label: string;
  price: string;
  cadence: string;
  summary: string;
  cta: string;
  highlight?: boolean;
  features: SubscriptionFeatures;
}
