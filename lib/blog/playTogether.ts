import { defaultLocale, locales, type Locale } from "../../i18n/config";
import { blogHref } from "../discover/feed";

/**
 * The game guides shown under the catalogue on `/games`, read from the same public
 * Sanity dataset the marketing site authors in.
 *
 * Which posts appear is decided in the CMS, not here: a post joins this list by being
 * given the `play-together` category, and leaves it by losing the category. There is
 * deliberately no slug list in this file — one would have to be edited every time a
 * guide is written, and would silently disagree with the blog the day it wasn't.
 *
 * Every language's guides come back from the one request and the reader's are picked in
 * the browser with `guidesFor`, for the reason the carousel carries its words unresolved:
 * the language is known there, and a cache shared by everybody cannot be per reader.
 *
 * **Call this from a server component only.** Same reasoning as `fetchDiscoverFeed`:
 * cached per deployment rather than per visitor, so Sanity sees a handful of requests a
 * day whatever the traffic.
 */

const PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const DATASET = process.env.NEXT_PUBLIC_SANITY_DATASET;
const API_VERSION = "2025-12-22";

/** Matches the discover feed: long enough to keep traffic off Sanity, short enough to publish and see. */
const REVALIDATE_SECONDS = 300;

/** A hung CMS must not hold the games page open. See `feed.ts` for why this is generous. */
const TIMEOUT_MS = 8000;

/** How long to stop asking after a failure, so a slow CMS does not slow every render. */
const COOLDOWN_MS = 30_000;

let quietUntil = 0;

/** The category slug that puts a post on this screen. Created in the Studio. */
const CATEGORY = "play-together";

/** Three, to line up with the three game cards above it. */
const LIMIT = 3;

export interface PlayTogetherPost {
  slug: string;
  title: string;
  excerpt?: string;
  imageUrl?: string;
  /** Absolute — the blog is not on this origin. */
  href: string;
}

/** Guides by the language they are written in. A language without any has no entry. */
export type PlayTogetherPosts = Partial<Record<Locale, PlayTogetherPost[]>>;

interface SanityPost {
  slug?: string;
  title?: string;
  excerpt?: string;
  imageUrl?: string;
}

/**
 * Newest first, which is what puts the three per-game guides here rather than the
 * general overview: the overview is what this screen already is.
 *
 * The same slice once per language, so the three are a language's own newest and no
 * language can crowd another out. `coalesce` counts a post written before the blog had
 * languages as English.
 */
const QUERY = `{${locales
  .map(
    (locale) =>
      `"${locale}": *[_type == "post" && !(_id in path("drafts.**"))` +
      ` && $cat in categories[]->slug.current && coalesce(language, "en") == "${locale}"]` +
      ` | order(publishedAt desc)[0...$limit]{` +
      `"slug": slug.current, title, excerpt,` +
      `"imageUrl": mainImage.asset->url` +
      `}`,
  )
  .join(",")}}`;

export async function fetchPlayTogetherPosts(): Promise<PlayTogetherPosts> {
  if (!PROJECT_ID || !DATASET) return {};

  // Still inside the cooldown from a recent failure — do not make everybody wait again.
  if (Date.now() < quietUntil) return {};

  const params =
    `&$cat=${encodeURIComponent(JSON.stringify(CATEGORY))}` +
    `&$limit=${encodeURIComponent(String(LIMIT))}`;

  const url =
    `https://${PROJECT_ID}.apicdn.sanity.io/v${API_VERSION}/data/query/${DATASET}` +
    `?query=${encodeURIComponent(QUERY)}${params}`;

  try {
    const response = await fetch(url, {
      next: { revalidate: REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!response.ok) throw new Error(`Sanity responded ${response.status}`);

    const body = (await response.json()) as {
      result?: Partial<Record<Locale, SanityPost[]>>;
    };

    quietUntil = 0;

    const posts: PlayTogetherPosts = {};
    for (const locale of locales) {
      const guides = (body.result?.[locale] ?? []).flatMap((raw) => toPost(raw, locale));
      if (guides.length > 0) posts[locale] = guides;
    }
    return posts;
  } catch (error) {
    quietUntil = Date.now() + COOLDOWN_MS;

    // No bundled fallback here, unlike the carousel: a missing reading section is
    // invisible to the visitor, while hardcoded posts would be a second copy of the
    // blog that goes stale and can link to something that has been retired.
    const reason = error instanceof Error ? error.message : String(error);
    console.error(`Play-together posts unavailable (${reason}); the games page omits them.`);

    return {};
  }
}

/**
 * What one reader is shown: the guides in their language when it has any, otherwise the
 * English ones. Never a mix, so the row and its "view all" link agree on a language.
 */
export function guidesFor(
  posts: PlayTogetherPosts,
  locale: Locale,
): { language: Locale; posts: PlayTogetherPost[] } {
  const language = posts[locale]?.length ? locale : defaultLocale;

  return { language, posts: posts[language] ?? [] };
}

/** A post with no slug or title has nothing to render, so it is dropped rather than shown blank. */
function toPost(raw: SanityPost, language: Locale): PlayTogetherPost[] {
  if (!raw.slug || !raw.title) return [];

  return [
    {
      slug: raw.slug,
      title: raw.title,
      ...(raw.excerpt ? { excerpt: raw.excerpt } : {}),
      // Sanity's CDN resizes on request, so no build step is needed for this art.
      ...(raw.imageUrl
        ? { imageUrl: `${raw.imageUrl}?w=640&fm=webp&fit=crop&auto=format` }
        : {}),
      href: blogHref(language, raw.slug),
    },
  ];
}
