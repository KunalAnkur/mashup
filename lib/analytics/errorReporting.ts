import posthog from "posthog-js";

/**
 * Crash reporting, on top of PostHog Error Tracking.
 *
 * Two kinds of error reach PostHog:
 *
 * - Uncaught ones — a throw in an event handler, a rejected promise nobody awaited. Those are
 *   picked up automatically by `capture_exceptions` in components/PostHogProvider.tsx.
 * - Ones React catches in an error boundary (app/error.tsx, app/global-error.tsx). React treats
 *   those as handled, so they never reach window.onerror and autocapture never sees them. The
 *   boundaries report them through reportCaughtError below instead.
 *
 * Either way they land as `$exception` events, grouped into issues under Error Tracking.
 */

export type CrashSource = "error_boundary" | "global_error_boundary";

const isPostHogReady = (): boolean => {
  try {
    return (
      typeof window !== "undefined" &&
      !!process.env.NEXT_PUBLIC_POSTHOG_KEY &&
      posthog.__loaded === true
    );
  } catch {
    return false;
  }
};

/** Report an error React caught in a boundary. Never throws — a crash report must not crash. */
export function reportCaughtError(
  error: Error & { digest?: string },
  source: CrashSource,
): void {
  if (process.env.NODE_ENV === "development") {
    console.error(`[${source}]`, error);
  }
  if (!isPostHogReady()) return;

  try {
    posthog.captureException(error, {
      source,
      path: window.location.pathname,
      // Set for errors thrown while rendering on the server. The message is redacted in
      // production, and the digest is what ties the event to the matching server log line.
      digest: error.digest,
      is_chunk_load_error: isChunkLoadError(error),
    });
  } catch {
    // Reporting is best-effort.
  }
}

/**
 * A tab opened before a deploy still references the old build's JS chunks. Vercel no longer
 * serves them, so the first navigation that needs one fails, and that surfaces as a crash.
 * Nothing is wrong with the code. A reload picks up the new build.
 */
export function isChunkLoadError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return (
    error.name === "ChunkLoadError" ||
    /Loading (CSS )?chunk [\w-]+ failed/i.test(error.message) ||
    /Failed to fetch dynamically imported module/i.test(error.message) ||
    /error loading dynamically imported module/i.test(error.message) ||
    /Importing a module script failed/i.test(error.message)
  );
}

const CHUNK_RELOAD_KEY = "movmash:chunk-reload-at";
const CHUNK_RELOAD_COOLDOWN_MS = 60_000;

/**
 * Reload once to recover from a stale build. Returns true when a reload was started.
 *
 * Guarded by a timestamp in sessionStorage, so a chunk that is really missing (not just
 * from an old build) shows the error screen after one attempt instead of reloading forever.
 */
export function reloadForStaleBuild(): boolean {
  try {
    const last = Number(window.sessionStorage.getItem(CHUNK_RELOAD_KEY) || 0);
    if (Date.now() - last < CHUNK_RELOAD_COOLDOWN_MS) return false;
    window.sessionStorage.setItem(CHUNK_RELOAD_KEY, String(Date.now()));
  } catch {
    // Without storage there is no loop guard, so don't risk an endless reload.
    return false;
  }
  window.location.reload();
  return true;
}
