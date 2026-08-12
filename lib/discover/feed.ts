import type {
  DiscoverAction,
  DiscoverCategory,
  DiscoverSlide,
  Localized,
} from "./types";
import { FALLBACK_SLIDES } from "./fallback";

/**
 * The home carousel's content, read from the Sanity project the marketing site already
 * authors in.
 *
 * No Sanity SDK and no Studio in this app — the dataset is public, so a slide is one
 * GROQ query over the CDN. That keeps the editor where the blog is edited and keeps this
 * bundle free of it.
 *
 * **Call this from a server component only.** It is cached for five minutes, which is
 * what makes Sanity see a few hundred requests a day whatever the traffic. Fetched from
 * each browser instead, request volume would scale with users for no benefit.
 */

const PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const DATASET = process.env.NEXT_PUBLIC_SANITY_DATASET;
const API_VERSION = "2025-12-22";

/** Long enough that traffic never reaches Sanity; short enough to publish and see it. */
const REVALIDATE_SECONDS = 300;

/** A hung CMS must not hold the home page open. Past this we serve the fallback. */
const TIMEOUT_MS = 4000;

/**
 * Sources map onto categories one for one today. They are separate names because the
 * schema's list is what an author picks and the category is what the sort understands —
 * the day "watch" splits into "trailer" and "playlist", only this map changes.
 */
const CATEGORY_BY_SOURCE: Record<string, DiscoverCategory> = {
  newGame: "newGame",
  watch: "watch",
  game: "game",
  read: "read",
  gift: "gift",
};

interface SanitySlide {
  _id: string;
  source: string;
  gameId?: string;
  watchUrl?: string;
  productId?: string;
  post?: { slug?: string; imageUrl?: string };
  title?: Localized;
  description?: Localized;
  ctaLabel?: Localized;
  eyebrow?: Localized;
  meta?: Localized;
  imageUrl?: string;
  imageWidth?: number;
  imageHeight?: number;
  fit?: "cover" | "contain";
  accent?: string;
  priority?: number;
  boostUntil?: string;
  publishedAt?: string;
}

/**
 * Asset dimensions come back with the URL so a slide can reserve its box before the art
 * arrives; without them every carousel reflows as it loads.
 */
const QUERY = `*[_type == "discoverSlide" && defined(source)]{
  _id, source, gameId, watchUrl, productId,
  "post": post->{ "slug": slug.current, "imageUrl": mainImage.asset->url },
  title, description, ctaLabel, eyebrow, meta,
  "imageUrl": image.asset->url,
  "imageWidth": image.asset->metadata.dimensions.width,
  "imageHeight": image.asset->metadata.dimensions.height,
  fit, accent, priority, boostUntil, publishedAt
}`;

export async function fetchDiscoverFeed(): Promise<DiscoverSlide[]> {
  const url =
    `https://${PROJECT_ID}.apicdn.sanity.io/v${API_VERSION}/data/query/${DATASET}` +
    `?query=${encodeURIComponent(QUERY)}`;

  try {
    const response = await fetch(url, {
      next: { revalidate: REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!response.ok) throw new Error(`Sanity responded ${response.status}`);

    const body = (await response.json()) as { result?: SanitySlide[] };
    const mapped = (body.result ?? []).map(toSlide).filter(isSlide);
    const slides = await Promise.all(mapped.map(withVideoThumbnail));

    // An empty feed is not the same as a broken one, but it looks identical on the page
    // — and a home page with no carousel is worse than one showing the defaults.
    return slides.length > 0 ? slides : FALLBACK_SLIDES;
  } catch (error) {
    console.error("Discover feed unavailable, serving the bundled slides:", error);
    return FALLBACK_SLIDES;
  }
}

const isSlide = (slide: DiscoverSlide | null): slide is DiscoverSlide => slide !== null;

// ---------------------------------------------------------------------------
// Video thumbnails
// ---------------------------------------------------------------------------

/**
 * Matches the video id in every YouTube link shape a person is likely to paste —
 * `youtu.be/ID`, `watch?v=ID`, `live/ID`, `embed/ID`, `shorts/ID` — with or without the
 * `si=`, `t=` and `list=` parameters that come with a share button.
 *
 * Yes, this is costume parsing a YouTube URL, which guardian otherwise owns. It is a
 * deliberate exception and a narrow one: the id is needed to *name a picture*, which is
 * a static file on a CDN. Everything that matters — normalising the link, expanding a
 * playlist into its videos, deciding what actually plays — still goes through guardian
 * when the slide is pressed. Getting this regex wrong costs a thumbnail, not a room.
 */
const YOUTUBE_ID =
  /(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:[^#]*&)?v=|live\/|embed\/|shorts\/|v\/))([A-Za-z0-9_-]{11})/;

/**
 * The art for a watch slide, when the author uploaded none.
 *
 * `maxresdefault` is the only 16:9 size YouTube publishes at a useful resolution
 * (1280×720), but it does not exist for every video — older and low-resolution uploads
 * have none. So it is asked for first and `hqdefault` is the fallback: 480×360 with
 * letterbox bars, which the band's crop happens to eat.
 *
 * Both are plain GETs on a CDN, so they sit inside Next's fetch cache with everything
 * else here and cost nothing per visitor. A day is the right window — whether a video
 * has a maxres thumbnail is not something that changes.
 */
async function withVideoThumbnail(slide: DiscoverSlide): Promise<DiscoverSlide> {
  if (slide.action.kind !== "watch" || slide.media.src) return slide;

  const id = YOUTUBE_ID.exec(slide.action.url)?.[1];
  // A playlist-only link has no video to take a picture from. The slide still works;
  // it just renders on its accent until somebody uploads art.
  if (!id) return slide;

  const maxres = `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`;

  try {
    const head = await fetch(maxres, {
      method: "HEAD",
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(2500),
    });
    if (head.ok) {
      return { ...slide, media: { ...slide.media, src: maxres, width: 1280, height: 720 } };
    }
  } catch {
    // Unreachable or slow: fall through to the size that always exists.
  }

  return {
    ...slide,
    media: { ...slide.media, src: `https://i.ytimg.com/vi/${id}/hqdefault.jpg` },
  };
}

/**
 * A slide whose reference is missing is dropped rather than rendered.
 *
 * That is the deal the schema makes: the author names a game or a product and the app
 * resolves the rest, so a reference that has gone means there is nothing to open. A
 * quiet omission beats a card that 404s on click.
 */
function toSlide(raw: SanitySlide): DiscoverSlide | null {
  const category = CATEGORY_BY_SOURCE[raw.source];
  if (!category || !raw.title) return null;

  const action = actionOf(raw);
  if (!action) return null;

  return {
    id: `${raw.source}:${raw._id}`,
    category,
    title: raw.title,
    ...(raw.description ? { description: raw.description } : {}),
    ...(raw.ctaLabel ? { ctaLabel: raw.ctaLabel } : {}),
    ...(raw.eyebrow ? { eyebrow: raw.eyebrow } : {}),
    ...(raw.meta ? { meta: raw.meta } : {}),
    action,
    media: mediaOf(raw),
    ...(raw.accent ? { accent: raw.accent } : {}),
    ...(typeof raw.priority === "number" ? { priority: raw.priority } : {}),
    ...(raw.publishedAt ? { publishedAt: raw.publishedAt } : {}),
    ...(raw.boostUntil ? { boostUntil: raw.boostUntil } : {}),
  };
}

function actionOf(raw: SanitySlide): DiscoverAction | null {
  switch (raw.source) {
    case "newGame":
    case "game":
      return raw.gameId ? { kind: "game", gameId: raw.gameId } : null;
    case "watch":
      return raw.watchUrl ? { kind: "watch", url: raw.watchUrl } : null;
    case "read":
      return raw.post?.slug
        ? { kind: "link", href: `${BLOG_ORIGIN}/blog/${raw.post.slug}`, external: true }
        : null;
    case "gift":
      // The product page itself is resolved in the browser, where the product list
      // already lives — the slide only needs to name which one.
      return raw.productId ? { kind: "link", href: `#product:${raw.productId}` } : null;
    default:
      return null;
  }
}

/** Where posts are published. The app is app.movmash.com; the blog is not. */
const BLOG_ORIGIN = process.env.NEXT_PUBLIC_SITE_ORIGIN ?? "https://movmash.com";

/**
 * Only what the author uploaded, plus the article image a `read` slide inherits from its
 * post. The rest — game covers, video thumbnails, product photos — is resolved in the
 * browser where the catalog and the product list already are, so the feed never has to
 * fan out to two more services before it can answer.
 */
function mediaOf(raw: SanitySlide): DiscoverSlide["media"] {
  const src = raw.imageUrl ?? raw.post?.imageUrl;

  return {
    // Sanity's CDN resizes on request, which is the reason no build step exists for
    // this art the way it does for game covers.
    ...(src ? { src: `${src}?w=1600&fm=webp&fit=crop&auto=format` } : {}),
    ...(raw.imageUrl && raw.imageWidth ? { width: raw.imageWidth } : {}),
    ...(raw.imageUrl && raw.imageHeight ? { height: raw.imageHeight } : {}),
    ...(raw.fit ? { fit: raw.fit } : {}),
  };
}
