import type { DesignTokens } from "@movmash/arcade-client";

/**
 * The design tokens games are rendered with.
 *
 * Games can't use Tailwind — they'd inherit this app's Tailwind version, config, and
 * content globs, which would have to be untangled the first time a game moves to its
 * own repo. So the app hands them plain CSS values instead, and they stay portable.
 *
 * These mirror `classTokens.ts`: the same zinc glass surfaces and rose/fuchsia accent,
 * expressed as colours rather than class names. When the app's palette changes, change
 * it here too — this is the one place games learn what Movmash looks like.
 */
export const activityDesignTokens: DesignTokens = {
  accent: "#fb7185", // rose-400
  accentSoft: "rgba(251, 113, 133, 0.14)",
  accentContrast: "#ffffff",
  surface: "rgba(255, 255, 255, 0.035)",
  surfaceRaised: "rgba(255, 255, 255, 0.075)",
  border: "rgba(255, 255, 255, 0.10)",
  text: "rgba(255, 255, 255, 0.92)",
  textMuted: "rgba(255, 255, 255, 0.50)",
  positive: "#34d399",
  negative: "#fb7185",
  radius: "14px",
  radiusSmall: "999px",
  fontFamily: "inherit",
};
