/**
 * The order the home carousel shows things in.
 *
 * Kept apart from both the sources and the UI because it is the only part of this
 * feature with rules in it, and rules are the part worth testing. Pure: same input and
 * the same `now` always give the same output.
 */

import { CATEGORY_TIER, type DiscoverCategory, type DiscoverSlide } from "./types";

export interface OrderOptions {
  /** Milliseconds since epoch. Passed in rather than read, so tests can hold time. */
  now?: number;
  /**
   * Anything stable per viewer — a user id, or a session id for a guest. Slides that
   * tie on every other rule are ordered by a hash of this, so two people do not see an
   * identical carousel while one person sees a consistent one.
   */
  seed?: string;
  /** Slides to return. Beyond about eight this stops being a hero and becomes a list. */
  limit?: number;
}

/**
 * How many leading positions the one-per-category rule covers. **0 turns it off.**
 *
 * Set to 0 because the order is curated by hand: the priority typed on each slide is
 * meant to be the answer, and a rule that quietly moves the second slide to fourth
 * because it shares a category with the first is a rule that makes the CMS lie.
 *
 * Raise it to 3 the day the feed is long enough that nobody is choosing the order slide
 * by slide any more. What it buys is protection against the top of the carousel being
 * three games, or — once the catalogue grows — three gifts.
 */
const SPREAD_WINDOW = 0;

export function isBoosted(slide: DiscoverSlide, now: number = Date.now()): boolean {
  if (!slide.boostUntil) return false;
  const until = Date.parse(slide.boostUntil);
  return Number.isFinite(until) && until > now;
}

/**
 * A slide's own `priority` if it has one, otherwise its category's rank.
 *
 * The override exists so a slide can jump the queue without recategorising it — but it
 * stays optional, because a scheme where every entry must be numbered is one where the
 * numbers stop meaning anything by the twentieth slide.
 */
function rank(slide: DiscoverSlide): number {
  return slide.priority ?? CATEGORY_TIER[slide.category];
}

/** Missing or unparseable dates sort oldest rather than throwing off the comparison. */
function freshness(slide: DiscoverSlide): number {
  if (!slide.publishedAt) return 0;
  const at = Date.parse(slide.publishedAt);
  return Number.isFinite(at) ? at : 0;
}

/** FNV-1a, 32-bit. Stable across processes and runs, unlike anything built in. */
export function hashString(value: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function compare(a: DiscoverSlide, b: DiscoverSlide, now: number, seed: string): number {
  const boostA = isBoosted(a, now);
  const boostB = isBoosted(b, now);
  if (boostA !== boostB) return boostA ? -1 : 1;

  const tier = rank(a) - rank(b);
  if (tier !== 0) return tier;

  const fresh = freshness(b) - freshness(a);
  if (fresh !== 0) return fresh;

  // Never fall through to input order: the feed is stitched from three sources whose
  // order is incidental, so ties would resolve differently on a whim.
  const hashed = hashString(`${seed}:${a.id}`) - hashString(`${seed}:${b.id}`);
  if (hashed !== 0) return hashed;

  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

/**
 * Sort by boost, then priority, then freshness, then a stable per-viewer hash.
 *
 * With `SPREAD_WINDOW` above 0, a second pass then holds back any slide that would give
 * one category two of the leading positions — deferred to just after the window, never
 * dropped. At 0, which is how it ships, priority is the whole answer.
 */
export function orderSlides(
  slides: readonly DiscoverSlide[],
  options: OrderOptions = {},
): DiscoverSlide[] {
  const now = options.now ?? Date.now();
  const seed = options.seed ?? "";

  const sorted = [...slides].sort((a, b) => compare(a, b, now, seed));

  const opening: DiscoverSlide[] = [];
  const rest: DiscoverSlide[] = [];
  const claimed = new Set<DiscoverCategory>();

  for (const slide of sorted) {
    // A boosted slide is exempt: when a game drops, it has earned the top of the feed,
    // and the point of the boost is that it is not competing on category at all.
    const eligible =
      opening.length < SPREAD_WINDOW && (isBoosted(slide, now) || !claimed.has(slide.category));

    if (eligible) {
      opening.push(slide);
      claimed.add(slide.category);
    } else {
      rest.push(slide);
    }
  }

  const ordered = [...opening, ...rest];
  return options.limit === undefined ? ordered : ordered.slice(0, Math.max(0, options.limit));
}
