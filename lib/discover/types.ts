/**
 * One thing two people could do together, in the form the home carousel renders.
 *
 * Every source — a game published in arcade, a slide written in Sanity, a product from
 * guardian — is flattened into this before it reaches the UI. The carousel therefore
 * knows nothing about games, videos, blogs or gifts, which is what stops the home page
 * from becoming five special cases inside one loop.
 */

/**
 * Priority is a property of the *kind* of thing, so the order is decided once here
 * rather than typed into a CMS field on every entry, where it would drift.
 *
 * These match the `SOURCES` table in `spotlight/src/sanity/schemaTypes/discoverSlideType.ts`.
 */
export type DiscoverCategory = "newGame" | "watch" | "game" | "read" | "gift";

/** Lower sorts first. A gap of 10 leaves room to slot a category in without a rewrite. */
export const CATEGORY_TIER: Record<DiscoverCategory, number> = {
  newGame: 10,
  watch: 20,
  game: 30,
  read: 40,
  gift: 50,
};

/**
 * Text in every language it has been written in, keyed by locale.
 *
 * Carried through unresolved rather than picked on the server, because the locale lives
 * in a React context in the browser: resolving early would mean refetching the whole
 * feed when somebody switches language. Four short strings a slide is nothing next to
 * the artwork. Read it with `textOf`.
 */
export type Localized = Partial<Record<string, string>>;

// ---------------------------------------------------------------------------
// What a click does
// ---------------------------------------------------------------------------

/**
 * The behaviour half of a slide, kept apart from the presentation half.
 *
 * A discriminated union rather than a URL, because these are not all navigations: two of
 * them open a room. One handler per `kind` lives in `useDiscoverAction`, so adding a
 * kind is a variant here plus a case there, and touches neither the feed nor the card.
 */
export type DiscoverAction =
  /** Opens a room with the game on the main surface. */
  | { kind: "game"; gameId: string }
  /**
   * Opens a room playing this URL. One video or a playlist — guardian's
   * `/url/metadata` normalises the link and expands a playlist into its videos, so
   * this side never parses a YouTube URL or counts items.
   */
  | { kind: "watch"; url: string }
  /** Goes somewhere: a blog post, a product page, a route in the app. */
  | { kind: "link"; href: string; external?: boolean };

// ---------------------------------------------------------------------------
// What a slide looks like
// ---------------------------------------------------------------------------

export interface DiscoverMedia {
  /**
   * Absolute URL, and optional on purpose: art is *resolved*, not required. In order —
   * the image the author uploaded, then whatever the source implies (the arcade cover,
   * the video thumbnail, the article image, the product photo), then the accent glow on
   * its own. Uploading art is an override, not a requirement.
   */
  src?: string;
  width?: number;
  height?: number;
  /** Whether the art fills the band or is framed inside it. See `fitOf`. */
  fit?: "cover" | "contain";
}

export interface DiscoverSlide {
  /**
   * Stable and unique across every source: `game:tictactoe`, `watch:<sanity id>`,
   * `post:…`, `gift:42`. It is the rotation seed and the analytics key, so reusing one
   * for different content silently merges their numbers.
   */
  id: string;
  category: DiscoverCategory;
  title: Localized;
  description?: Localized;
  /** Button text. Falls back to a default for the action's kind. */
  ctaLabel?: Localized;
  /** The small line above the title. Falls back to the category's name. */
  eyebrow?: Localized;
  /** One short fact beside the button — "24 tracks", "2 players", "₹499". */
  meta?: Localized;
  action: DiscoverAction;
  media: DiscoverMedia;
  /** CSS colour the slide is tinted with. Games bring their own from the manifest. */
  accent?: string;
  /**
   * Overrides the category's rank. Left unset — the normal case — a slide sorts by the
   * tier its category carries, so nobody has to keep a numbering scheme in their head.
   */
  priority?: number;
  /** ISO 8601. Breaks ties within a rank — newer first. */
  publishedAt?: string;
  /**
   * ISO 8601. While in the future the slide outranks everything unboosted, whatever its
   * category, and is exempt from the one-per-category rule at the top of the feed. How a
   * game drop holds the front of the carousel — and how it stops, without anyone
   * remembering to switch it off.
   */
  boostUntil?: string;
}

/**
 * Whether art fills the band or is framed inside it.
 *
 * Not measured from the image: a square game cover crops beautifully because it is a
 * scene, and a square product photo crops into nonsense because it is an object on a
 * white background. Aspect cannot tell those apart, so the default comes from the
 * category and the author overrides it on the slide.
 */
export function fitOf(slide: DiscoverSlide): "cover" | "contain" {
  return slide.media.fit ?? (slide.category === "gift" ? "contain" : "cover");
}
