import type { CatalogEntry } from "@movmash/arcade-client";

/**
 * What a card needs to draw a game's cover, whichever shape the manifest is in.
 *
 * arcade publishes three pre-sized WebPs per game — 1200, 800 and 400 wide — and the
 * point of returning a `srcSet` is that the browser picks one. A phone showing a card
 * at 160px must not download the 1200px file; that is most of the weight of a gallery.
 *
 * Two shapes are handled because the manifest changed:
 *   ≤ arcade 0.1.7  `cover` was one URL string
 *   ≥ arcade 0.1.8  `cover` is { src, md, sm, width, height }
 *
 * The cast is here rather than at the call sites because the installed types still
 * describe the old shape — `@movmash/activity-sdk` was not republished alongside
 * `@movmash/arcade-client@0.1.8`, so TypeScript is one version behind the data. This
 * file is the single place that knows, and the string branch plus the cast can both
 * go once the SDK is on ≥0.1.3.
 */

interface LegacyOrCurrentCover {
  src?: string;
  md?: string;
  sm?: string;
  width?: number;
  height?: number;
}

export interface GameCover {
  src: string;
  srcSet?: string;
  width?: number;
  height?: number;
}

export function coverOf(presentation: CatalogEntry["presentation"]): GameCover | null {
  const cover = presentation?.cover as string | LegacyOrCurrentCover | undefined;
  if (!cover) return null;

  if (typeof cover === "string") return { src: cover };
  if (!cover.src) return null;

  // Widths are stated rather than measured, and they have to match what
  // arcade/scripts/build-presentation.mjs encoded — a srcSet whose descriptors lie
  // makes the browser choose badly in a way nothing reports.
  const candidates = [
    cover.sm ? `${cover.sm} 400w` : null,
    cover.md ? `${cover.md} 800w` : null,
    `${cover.src} 1200w`,
  ].filter((entry): entry is string => entry !== null);

  return {
    src: cover.src,
    ...(candidates.length > 1 ? { srcSet: candidates.join(", ") } : {}),
    ...(cover.width ? { width: cover.width } : {}),
    ...(cover.height ? { height: cover.height } : {}),
  };
}
