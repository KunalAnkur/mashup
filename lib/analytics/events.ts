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

// In-app sources (where in the app they signed up)
type InAppSource = "landing" | "home" | "room_join" | "stream" | "sync" | "direct" | "invite_link";

// External traffic sources (where they came from)
type ExternalSource = 
  | "reddit" 
  | "tiktok" 
  | "instagram" 
  | "twitter" 
  | "facebook" 
  | "youtube" 
  | "linkedin"
  | "discord"
  | "producthunt"
  | "hackernews"
  | "google_ads"
  | "google_organic"
  | "referral"
  | "email_campaign"
  | "blog";

export type SignupSource = InAppSource | ExternalSource | "unknown";

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

/** 
 * Get UTM parameters from URL
 * These are automatically captured but we can also grab them manually
 */
const getUTMParams = () => {
  if (typeof window === "undefined") return {};
  
  const params = new URLSearchParams(window.location.search);
  const utm: Record<string, string> = {};
  
  const utmKeys = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];
  utmKeys.forEach(key => {
    const value = params.get(key);
    if (value) utm[key] = value;
  });
  
  return utm;
};

/**
 * Automatically detect signup source from UTM params or referrer
 * Use this when you want to auto-detect external traffic source
 * 
 * @example
 * trackSignup("google", detectSignupSource() || "direct")
 */
export const detectSignupSource = (): SignupSource | null => {
  if (typeof window === "undefined") return null;
  
  const params = new URLSearchParams(window.location.search);
  const utmSource = params.get("utm_source")?.toLowerCase();
  const referrer = document.referrer?.toLowerCase() || "";
  
  // Check UTM source first (most reliable)
  if (utmSource) {
    const sourceMap: Record<string, SignupSource> = {
      "reddit": "reddit",
      "tiktok": "tiktok",
      "instagram": "instagram",
      "twitter": "twitter",
      "x": "twitter", // X is Twitter
      "facebook": "facebook",
      "fb": "facebook",
      "youtube": "youtube",
      "yt": "youtube",
      "linkedin": "linkedin",
      "discord": "discord",
      "producthunt": "producthunt",
      "product_hunt": "producthunt",
      "hackernews": "hackernews",
      "hn": "hackernews",
      "google": "google_ads",
      "email": "email_campaign",
      "newsletter": "email_campaign",
      "blog": "blog",
      "referral": "referral",
    };
    
    const detected = sourceMap[utmSource];
    if (detected) return detected;
  }
  
  // Fallback: check referrer URL
  if (referrer) {
    if (referrer.includes("reddit.com")) return "reddit";
    if (referrer.includes("tiktok.com")) return "tiktok";
    if (referrer.includes("instagram.com")) return "instagram";
    if (referrer.includes("twitter.com") || referrer.includes("x.com")) return "twitter";
    if (referrer.includes("facebook.com") || referrer.includes("fb.com")) return "facebook";
    if (referrer.includes("youtube.com") || referrer.includes("youtu.be")) return "youtube";
    if (referrer.includes("linkedin.com")) return "linkedin";
    if (referrer.includes("discord.com") || referrer.includes("discord.gg")) return "discord";
    if (referrer.includes("producthunt.com")) return "producthunt";
    if (referrer.includes("news.ycombinator.com")) return "hackernews";
    if (referrer.includes("google.com")) return "google_organic";
  }
  
  return null; // Could not detect
};

/** 
 * Track when a user signs up
 * @param method - Authentication method used (google, email, guest, etc.)
 * @param inAppSource - Where in the app they signed up (home, direct, room_join, etc.)
 * 
 * SMART DETECTION:
 * - First checks UTM params and referrer for external source (reddit, tiktok, etc.)
 * - If external source found → uses that as signup_source
 * - If no external source → uses inAppSource as signup_source
 * 
 * PROPERTIES SENT:
 * - signup_source: Final source (external > in-app)
 * - in_app_location: Where in the app they signed up (always sent)
 * - utm_* params: All UTM parameters from URL
 * 
 * @example
 * // User comes from Reddit → signup_source: "reddit", in_app_location: "home"
 * trackSignup("google", "home")
 * 
 * // Direct visit → signup_source: "home", in_app_location: "home"  
 * trackSignup("google", "home")
 * 
 * // Joining a room → signup_source: "room_join", in_app_location: "room_join"
 * trackSignup("guest", "room_join")
 */
export const trackSignup = (
  method: AuthMethod, 
  inAppSource: SignupSource = "unknown"
) => {
  const utmParams = getUTMParams();
  
  // Priority: External source (UTM/referrer) > In-app source > "unknown"
  // This way if user comes from Reddit but signs up on home page,
  // we capture "reddit" not "home"
  const externalSource = detectSignupSource();
  const finalSource = externalSource || inAppSource;
  
  safeCapture("user_signed_up", { 
    method,
    signup_source: finalSource,
    in_app_location: inAppSource, // Also track where in app they signed up
    ...utmParams, // Include UTM params for attribution
  });
  logEvent("user_signed_up", { 
    method, 
    signup_source: finalSource, 
    in_app_location: inAppSource, 
    ...utmParams 
  });
  
  // Debug info in development
  if (isDev) {
    console.group("🔍 [Analytics] Signup Tracking");
    console.log("Method:", method);
    console.log("Signup Source (final):", finalSource);
    console.log("In-App Location:", inAppSource);
    console.log("External Source Detected:", detectSignupSource() || "none");
    console.log("UTM Params:", utmParams);
    console.log("Full Event Data:", {
      method,
      signup_source: finalSource,
      in_app_location: inAppSource,
      ...utmParams
    });
    console.groupEnd();
  }
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

// ============ TEST UTILITIES ============

/**
 * Test signup tracking with different sources
 * Use this in browser console to test
 * 
 * @example
 * // In browser console:
 * window.testSignup() // Shows current state
 * window.testSignup('reddit') // Shows test URL for reddit
 */
export const testSignupTracking = (source?: string) => {
  if (typeof window === "undefined") {
    console.warn("Test utilities only work in browser");
    return;
  }
  
  console.group("🧪 Testing Signup Tracking");
  
  // Test current URL detection
  const currentSource = detectSignupSource();
  const utmParams = getUTMParams();
  
  console.log("📍 Current URL:", window.location.href);
  console.log("🔍 Detected Source:", currentSource || "none (no UTM/referrer)");
  console.log("📊 UTM Params:", Object.keys(utmParams).length > 0 ? utmParams : "none");
  console.log("🔗 Referrer:", document.referrer || "none");
  
  // Show all test URLs
  const testSources = ["reddit", "tiktok", "instagram", "twitter", "facebook", "youtube"];
  console.log("\n📝 Test URLs (copy & open in new tab, then signup):");
  testSources.forEach(s => {
    const testUrl = `${window.location.origin}${window.location.pathname}?utm_source=${s}`;
    console.log(`  ${s.padEnd(10)} → ${testUrl}`);
  });
  
  if (source) {
    const testUrl = `${window.location.origin}${window.location.pathname}?utm_source=${source}`;
    console.log(`\n✅ Test URL for "${source}":`);
    console.log(`   ${testUrl}`);
    console.log(`\n👉 Copy above URL, open in new tab, then signup!`);
    console.log(`   After signup, check PostHog Live Events for signup_source: "${source}"`);
  } else {
    console.log("\n💡 Tip: Call testSignup('reddit') to get a specific test URL");
  }
  
  console.groupEnd();
  
  return {
    currentSource,
    utmParams,
    referrer: document.referrer,
    testUrls: testSources.reduce((acc, s) => {
      acc[s] = `${window.location.origin}${window.location.pathname}?utm_source=${s}`;
      return acc;
    }, {} as Record<string, string>)
  };
};

/**
 * Simulate signup event (for testing only)
 * WARNING: This creates a test event in PostHog
 * 
 * @example
 * // In browser console:
 * window.simulateSignup('guest', 'reddit')
 */
export const simulateSignup = (method: AuthMethod = "guest", source?: SignupSource) => {
  if (process.env.NODE_ENV === "production") {
    console.warn("⚠️ simulateSignup should not be used in production!");
    return;
  }
  
  console.group("🧪 Simulating Signup Event");
  console.log("Method:", method);
  console.log("Source:", source || "direct");
  
  trackSignup(method, source || "direct");
  
  console.log("✅ Test event sent to PostHog!");
  console.log("\n📊 How to check in PostHog:");
  console.log("1. Go to: https://app.posthog.com/events");
  console.log("2. Look for 'user_signed_up' event");
  console.log("3. Click on the event → Check Properties");
  console.log("4. You should see: signup_source =", source || "direct");
  console.log("\n💡 Or create a Breakdown:");
  console.log("   Insights → New Insight → Trends");
  console.log("   Event: user_signed_up");
  console.log("   Breakdown → Event properties → signup_source");
  console.groupEnd();
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
  
  // Test utilities (dev only)
  testSignupTracking,
  simulateSignup,
  detectSignupSource,
};

export default analytics;
