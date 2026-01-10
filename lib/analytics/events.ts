/**
 * 📘 MOVMASH – POSTHOG ANALYTICS EVENTS
 * 
 * Naming rules:
 * - snake_case
 * - past tense (created, started, joined)
 * - result-oriented (not "click")
 */

import posthog from "posthog-js";

// ============ TYPES ============

type PageName = "landing" | "home" | "room" | "stream" | "sync" | "login" | "signup";
type CTAName = "create_room" | "join_room" | "stream" | "sync" | "login" | "signup" | "copy_link";
type RoomType = "stream" | "sync";
type VideoSource = "file" | "url" | "screen";
type UserRole = "host" | "guest";
type InviteMethod = "copy_link" | "whatsapp" | "telegram" | "share_api";
type ErrorArea = "room" | "video_sync" | "upload" | "network" | "auth";
type AuthMethod = "google" | "google_one_tap" | "guest" | "email";

// ============ SAFETY CHECK ============

/** Check if PostHog is initialized and ready */
const isPostHogReady = (): boolean => {
  try {
    return typeof window !== "undefined" && 
           !!process.env.NEXT_PUBLIC_POSTHOG_KEY &&
           posthog.__loaded === true;
  } catch {
    return false;
  }
};

/** Safe capture wrapper - won't throw if PostHog isn't ready */
const safeCapture = (event: string, props?: Record<string, any>) => {
  try {
    if (isPostHogReady()) {
      posthog.capture(event, props);
    }
  } catch (e) {
    // Silently fail - analytics should never break the app
    if (process.env.NODE_ENV === "development") {
      console.warn(`[Analytics] Failed to capture ${event}:`, e);
    }
  }
};

// ============ DEV LOGGER ============

const isDev = process.env.NODE_ENV === "development";

const logEvent = (event: string, props?: Record<string, any>) => {
  if (isDev) {
    console.log(`📊 [Analytics] ${event}`, props || "");
  }
};

// ============ GLOBAL PROPERTIES ============

/**
 * Register global properties that will be sent with every event
 * Call this once on app initialization
 */
export const registerGlobalProperties = () => {
  try {
    if (isPostHogReady()) {
      posthog.register({
        app: "movmash",
        platform: "web",
        env: process.env.NODE_ENV,
      });
      logEvent("Global properties registered");
    }
  } catch {
    // Silently fail
  }
};

// ============ AUTH EVENTS ============

/** Track when a user signs up */
export const trackSignup = (method: AuthMethod) => {
  safeCapture("user_signed_up", { method });
  logEvent("user_signed_up", { method });
};

/** Track when a user logs in */
export const trackLogin = (method: AuthMethod) => {
  safeCapture("user_logged_in", { method });
  logEvent("user_logged_in", { method });
};

/** Track returning user */
export const trackUserReturned = (daysSinceLast: number) => {
  safeCapture("user_returned", { days_since_last: daysSinceLast });
  logEvent("user_returned", { days_since_last: daysSinceLast });
};

// ============ PAGE / ENTRY EVENTS ============

/** Track page view with custom page name */
export const trackPageViewed = (page: PageName) => {
  safeCapture("page_viewed", { page });
  logEvent("page_viewed", { page });
};

/** Track CTA button clicks */
export const trackCTAClicked = (cta: CTAName, additionalProps?: Record<string, any>) => {
  safeCapture("cta_clicked", { cta, ...additionalProps });
  logEvent("cta_clicked", { cta, ...additionalProps });
};

// ============ ROOM FLOW EVENTS ⭐⭐⭐ ============

/** Track room creation - CRITICAL */
export const trackRoomCreated = (
  roomId: string,
  roomType: RoomType,
  source: VideoSource,
  entryPoint: string = "home"
) => {
  safeCapture("room_created", {
    room_id: roomId,
    room_type: roomType,
    source,
    entry_point: entryPoint,
  });
  logEvent("room_created", { room_id: roomId, room_type: roomType, source, entry_point: entryPoint });
};

/** Track room joined */
export const trackRoomJoined = (
  roomId: string,
  role: UserRole,
  participantsCount?: number
) => {
  safeCapture("room_joined", {
    room_id: roomId,
    role,
    participants_count: participantsCount,
  });
  logEvent("room_joined", { room_id: roomId, role, participants_count: participantsCount });
};

/** Track room left */
export const trackRoomLeft = (roomId: string, durationSec: number) => {
  safeCapture("room_left", {
    room_id: roomId,
    duration_sec: durationSec,
  });
  logEvent("room_left", { room_id: roomId, duration_sec: durationSec });
};

// ============ VIDEO FLOW EVENTS ============

/** Track video source selection */
export const trackVideoSourceSelected = (roomId: string, source: VideoSource) => {
  safeCapture("video_source_selected", {
    room_id: roomId,
    source,
  });
  logEvent("video_source_selected", { room_id: roomId, source });
};

/** Track video started playing */
export const trackVideoStarted = (
  roomId: string,
  source: VideoSource,
  isHost: boolean
) => {
  safeCapture("video_started", {
    room_id: roomId,
    source,
    is_host: isHost,
  });
  logEvent("video_started", { room_id: roomId, source, is_host: isHost });
};

/** Track sync started - CRITICAL */
export const trackSyncStarted = (roomId: string, latencyMs?: number) => {
  safeCapture("sync_started", {
    room_id: roomId,
    latency_ms: latencyMs,
  });
  logEvent("sync_started", { room_id: roomId, latency_ms: latencyMs });
};

/** Track sync error */
export const trackSyncError = (
  roomId: string,
  reason: "desync" | "timeout" | "network" | "unknown"
) => {
  safeCapture("sync_error", {
    room_id: roomId,
    reason,
  });
  logEvent("sync_error", { room_id: roomId, reason });
};

/** Track video buffering */
export const trackVideoBuffering = (roomId: string, durationMs: number) => {
  safeCapture("video_buffering", {
    room_id: roomId,
    duration_ms: durationMs,
  });
  logEvent("video_buffering", { room_id: roomId, duration_ms: durationMs });
};

// ============ SHARING / VIRAL EVENTS ============

/** Track room link copied */
export const trackRoomLinkCopied = (roomId: string) => {
  safeCapture("room_link_copied", { room_id: roomId });
  logEvent("room_link_copied", { room_id: roomId });
};

/** Track invite sent */
export const trackInviteSent = (roomId: string, method: InviteMethod) => {
  safeCapture("invite_sent", {
    room_id: roomId,
    method,
  });
  logEvent("invite_sent", { room_id: roomId, method });
};

// ============ ERROR TRACKING ============

/** Track errors - use this for important errors */
export const trackError = (area: ErrorArea, message: string, additionalProps?: Record<string, any>) => {
  safeCapture("error_occurred", {
    area,
    message,
    ...additionalProps,
  });
  logEvent("error_occurred", { area, message, ...additionalProps });
};

// ============ UTILITY ============

/** Identify user (call after login/signup) */
export const identifyUser = (userId: string, traits?: Record<string, any>) => {
  try {
    if (isPostHogReady()) {
      posthog.identify(userId, traits);
      logEvent("User identified", { userId, ...traits });
    }
  } catch {
    // Silently fail
  }
};

/** Reset user (call on logout) */
export const resetUser = () => {
  try {
    if (isPostHogReady()) {
      posthog.reset();
      logEvent("User reset");
    }
  } catch {
    // Silently fail
  }
};

// ============ EXPORT ALL ============

export const analytics = {
  // Global
  registerGlobalProperties,
  
  // Auth
  trackSignup,
  trackLogin,
  trackUserReturned,
  
  // Pages
  trackPageViewed,
  trackCTAClicked,
  
  // Room
  trackRoomCreated,
  trackRoomJoined,
  trackRoomLeft,
  
  // Video
  trackVideoSourceSelected,
  trackVideoStarted,
  trackSyncStarted,
  trackSyncError,
  trackVideoBuffering,
  
  // Sharing
  trackRoomLinkCopied,
  trackInviteSent,
  
  // Error
  trackError,
  
  // User
  identifyUser,
  resetUser,
};

export default analytics;
