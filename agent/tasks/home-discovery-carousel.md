# Home discovery carousel — plan

Replace the static hero (`components/Onboard/HeroBanner.tsx`) with a rotating carousel
that answers one question: **what can we do together right now?**

Games, watch picks, articles and gifts all appear as the same kind of slide. No section
headings per content type — the mix *is* the message.

---

## 0. Storage decision — Sanity, not guardian

Slides are authored by hand, with images and priorities. That is an editing job, and
Sanity already provides the editor, image hosting, drafts, publish/unpublish, history and
rollback. Guardian would provide a table; everything above it — CRUD endpoints, auth on
them, a form UI, S3 upload, image resizing, a preview mode — would have to be built to
arrive back where we already are.

The slide document stays thin: presentation plus a pointer. A gift slide stores a product
id and costume resolves it against guardian at render, so a delisted product drops out on
its own. A game slide stores a game id and the art comes from the arcade catalog.

Two things follow from choosing Sanity:

- **Fetch server-side and cache** (5 minutes). Sanity then sees a few hundred requests a
  day whatever the traffic, so API quotas never become a scaling question. Fetching
  per-browser is what turns a free plan into a bill.
- **Ship a bundled fallback feed** so an outage shows last-known-good slides rather than
  an empty hero — the arcade `library.generated.ts` pattern.

Revisit only if slides need to know *who is looking* (free vs premium, play history), or
if scheduling and per-slide analytics become a product feature. Neither means moving
content into guardian: keep Sanity as the store and let guardian own **ordering** —
costume asks it for slide ids in order, then renders the content from Sanity. The
`DiscoverSlide` contract below does not change, so that swap stays a one-file change.

---

## 1. Where the content comes from

**Every slide is authored in the CMS.** One `discoverSlide` document type; the feed is
one query. Nothing appears in the carousel that nobody chose to put there.

What the author types is a *reference*, not a copy. Costume resolves it at render:

| Category | Author enters | Costume resolves from |
|---|---|---|
| New game drop | game id | arcade catalog — title, tagline, accent, cover |
| Popular game | game id | same |
| Watch Together | YouTube link (video or playlist) | guardian `/url/metadata` — title, thumbnail |
| Blog / date idea | reference to a `post` | Sanity — title, main image |
| Gift | product id | guardian `/api/v1/products` — name, image, price |

So a game slide is a game id and a category. The art comes from
`asset.movmash.com` because arcade already published it — no cover to upload, and it
stays in step with the game. Every resolved field can be overridden by typing one on the
slide; that is what the optional title and image fields are for.

Two things follow. A slide whose reference has gone — a delisted product, a game pulled
from the catalogue — drops out of the feed on its own rather than 404ing. And a game
drop is two fields and a publish, not a deploy.

### The CMS question

**Recommended: keep one Sanity project, add the schema to spotlight's studio, and let
costume read it over plain HTTPS.** No studio, no `sanity` package, no token in costume.

- You author at `movmash.com/studio`, where you already author blogs.
- Blog slides reference the real `post` document instead of copying its title and image.
- Costume adds ~40 lines: a GROQ fetch against
  `https://jblm6zqq.apicdn.sanity.io/v<ver>/data/query/production`, cached, with a
  bundled fallback feed — the same shape as arcade's `library.generated.ts`, so a Sanity
  outage degrades to a decent default rather than an empty hero.
- The dataset is already public (spotlight's client uses no token), so this is a read of
  content you are publishing anyway.

Considered and rejected:

- **Sanity Studio inside costume** — a second studio for one dataset, and it drags the
  whole editor bundle into the app you want to keep lean.
- **Feed endpoint on spotlight** (`movmash.com/api/discover-feed`) — tidier contract, but
  it makes the marketing site a runtime dependency of the app. Worth revisiting only if
  the merge logic gets heavy enough to belong on a server.
- **Static JSON on `asset.movmash.com`** — cheapest, matches the arcade pattern, but every
  edit is a file upload and there is no preview. Good fallback if Sanity is dropped.
- **Table in guardian + admin UI** — the right answer the day slides need scheduling,
  targeting or per-slide analytics. Too much to build now.

---

## 2. What a click does

A slide's behaviour is a discriminated `action`, not a URL — two of the five kinds open a
room rather than navigating. One handler per kind is registered in the carousel, so a new
kind is a variant in `types.ts` plus a handler, and touches neither the feed nor the card.

| Kind | Used by | What happens | Already exists |
|---|---|---|---|
| `game` | new game, popular game | `useOpenActivityRoom(gameId)` — dispatches a one-entry playlist, sets `refer`, `AuthGuard` creates the room | yes, the games gallery uses it |
| `watch` | watch together | `POST /url/metadata` → **every** returned video becomes a playlist entry → same dispatch → room, exactly as `/sync` behaves today | yes, `/sync` uses it |
| `link` | blog, gift | navigate; external opens a new tab | trivial |

### YouTube, specifically

Guardian's `url.service` already does everything a watch slide needs, and costume already
calls it (`useGetUrlMetadataMutation`):

- normalises every YouTube form — `youtu.be`, `m.youtube`, `&list=`, `?t=`;
- expands a playlist link (`PL…`, `UU…`, `LL…`) into up to 50 videos, each with title,
  thumbnail and channel;
- returns a single video as a one-item array, so both cases have one shape;
- caches the answer in Redis.

So the author pastes a link — video *or* playlist — and nothing in costume parses it.

**Thumbnail resolution**, in order: the image on the slide if the author set one → the
`thumbnail` guardian returned for the first video → the accent-and-glyph fallback. Art is
optional on every slide; supplying it is an override, not a requirement.

**When to resolve.** Display metadata (title, thumbnail of the first video) at feed-build
time, server-side, inside the same 5-minute cache — so the slide can show the real video
title without anyone copying it into the CMS. Playlist *expansion* stays at click time:
fifty entries per slide is not worth putting in the page payload for a slide most people
scroll past. The click therefore shows a brief loading state, the same as `/sync` does.

---

## 3. Ordering

```
sort by:  active boost  →  priority  →  freshness  →  stable hash of id
```

- **Priority** defaults to the slide's category rank — new game, watch, game, read, gift.
  Leave the field empty and it takes that; type a number and it wins. So the common case
  needs no thought, and a slide that has to jump the queue can.
- **Boost** is a date. While it is in the future the slide leads the carousel whatever its
  category, and is exempt from the rule below. That is how a drop holds slide 1 for a
  fortnight — and how it stops without anyone remembering to switch it off.
- **At most one slide per category in the opening three**, so the top is never three
  gifts in a row.
- The stable hash keeps the order consistent for one viewer but not identical for the
  next, so the same slide is not always fourth for everybody.

---

## 4. Phases

Each phase ships on its own and leaves the page working.

### Phase 0 — Contract ✅
`DiscoverSlide`, `DiscoverAction` and `orderSlides` in `lib/discover/`. No UI.

### Phase 1 — Look first, then build ✅
1. A throwaway mock of the carousel to settle how it looks — layout, art treatment,
   how a game slide differs from a watch slide, what the controls are. Nothing wired.
2. Then the real component against a hardcoded array. Embla is already a dependency
   (`ProductCarousel.tsx`, `Panel.tsx` use it) — same pattern here.

Cinematic full-bleed slide: art, accent-tinted wash, title, one line of copy, one CTA.
Autoplay ~6s, pauses on hover/focus, respects `prefers-reduced-motion`, dots + arrows,
swipe on touch, keyboard reachable.
*Done when:* the mock is approved and `HeroBanner` is replaced, right at 375/1000/1600.

### Phase 2 — Actions ✅
The handler registry: `game` → `useOpenActivityRoom`, `watch` → metadata then room,
`link` → navigate. Loading state on the slide while a room is being made.
*Done when:* every kind in §2 works from a hardcoded slide.

### Phase 3 — The Sanity schema ✅ and the feed
Schema is in `spotlight/src/sanity/`: `discoverSlide`, plus `localeString` / `localeText`
built from one `locales.ts` list, and a "Home carousel" section at the top of the Studio.
`source` is the spine — it picks which reference field appears, what the button does,
where art comes from, and the default rank. Validated with `sanity schema validate`.

Costume reads it in `lib/discover/feed.ts`: one GROQ query over the public CDN, five
minute cache, bundled fallback. `app/(dashboard)/page.tsx` is now a server component that
fetches and hands slides to the client carousel.
*Done when:* a slide published in the studio appears on app.movmash.com without a deploy.

### Phase 4 — Resolvers ✅
Fill in what the author did not type. Game id → arcade catalog (title, tagline, accent,
cover). Watch URL → guardian metadata (title, thumbnail). Post → Sanity. Product id →
guardian. A reference that no longer resolves drops its slide from the feed.
*Done when:* a slide carrying only a category and a game id renders complete.

### Phase 5 — Polish
`discover_slide_viewed` / `discover_slide_clicked` in `lib/analytics/events.ts` with
category and position. Image preloading for slide 2 only. Cap the feed (~8 slides).
Empty and single-slide states.
*Done when:* click-through per category is visible in PostHog.

---

## 5. Open questions

1. **Localisation.** Costume ships en/tr/es/ar and all four must stay in step. Slide copy
   from a CMS breaks that guarantee. Proposal: localized fields in Sanity with English
   required and the rest falling back to English — same rule as arcade's image titles.
2. **Guests.** The home page renders logged-out. Should gift and premium-game slides
   appear before sign-in?
3. **Boost length.** How many days does a new game hold slide 1?
4. **Slide count.** Eight feels like the ceiling before it stops being a hero and starts
   being a list.
