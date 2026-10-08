/**
 * Which blog address the app hands a reader, in each language.
 *
 * The blog lives on the marketing site, where English is at the root and every other
 * language under its own prefix (`/tr/blog/…`). Two places in this app link into it — the
 * guides under the games catalogue and the "read" slides of the home carousel — and both
 * have to send a Turkish reader to the Turkish post when there is one, and to the English
 * one when there is not.
 *
 *   node --test scripts/blog-language.test.mjs
 *
 * No test runner is installed in this repo, so this leans on what is: the project's own
 * TypeScript compiler turns the modules into plain JavaScript in a temp folder, and
 * node:test does the rest.
 *
 * Sanity is replaced by a stubbed `fetch` wherever a translation is involved, because the
 * answer has to be right before the first translation is published. The two tests marked
 * "live" send the real queries instead, which is the only way to know Sanity can parse them.
 */

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, realpathSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, test } from "node:test";

const root = path.resolve(import.meta.dirname, "..");
const require = createRequire(import.meta.url);

// The project's .env names the Sanity project. Without it the live tests have nothing to ask.
try {
  process.loadEnvFile(path.join(root, ".env"));
} catch {
  // No .env here (a fresh checkout, CI): the stubbed tests still run.
}
const hasSanity = Boolean(
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID && process.env.NEXT_PUBLIC_SANITY_DATASET,
);
const live = { skip: hasSanity ? false : "no Sanity project in .env" };

// The modules read these when they load, and refuse to fetch at all without them.
process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ??= "stubbed";
process.env.NEXT_PUBLIC_SANITY_DATASET ??= "stubbed";

// The real path, because that is what `require.cache` is keyed by (macOS keeps its temp
// folder behind a symlink) and `load` below finds its modules there.
const out = realpathSync(mkdtempSync(path.join(tmpdir(), "costume-blog-language-")));
after(() => rmSync(out, { recursive: true, force: true }));

// Types are the build's business; this only needs the JavaScript.
execFileSync(
  process.execPath,
  [
    require.resolve("typescript/bin/tsc"),
    ...["--outDir", out, "--rootDir", root],
    ...["--module", "commonjs", "--target", "es2022", "--noCheck"],
    "lib/blog/playTogether.ts",
    "lib/discover/text.ts",
  ],
  { cwd: root, stdio: "inherit" },
);

/**
 * A fresh copy for every test. The modules remember a failed request and stop asking for
 * half a minute, which would otherwise turn one failing test into a row of them.
 */
function load(file) {
  for (const id of Object.keys(require.cache)) {
    if (id.startsWith(out)) delete require.cache[id];
  }
  return require(path.join(out, file));
}

const guides = () => load("lib/blog/playTogether.js");
const carousel = () => load("lib/discover/feed.js");

const text = () => load("lib/discover/text.js");

const { BLOG_ORIGIN } = carousel();

/** Makes Sanity answer `result` for the length of one test. */
const sanityAnswers = (t, result) =>
  t.mock.method(globalThis, "fetch", async () => new Response(JSON.stringify({ result })));

/** A failed request is logged, not thrown, so this is how a test sees one. */
const errorsLogged = (t) => t.mock.method(console, "error", () => {}).mock;

// ---------------------------------------------------------------------------
// The guides under the games catalogue
// ---------------------------------------------------------------------------

const connect4 = { slug: "play-connect-4-online", title: "Play Connect 4 online" };
const connect4Tr = { slug: "online-connect-4-oyna", title: "Online Connect 4 oyna" };

test("guides come back under the language they are written in, each with its own address", async (t) => {
  sanityAnswers(t, { en: [connect4], tr: [connect4Tr], es: [], ar: [] });

  assert.deepEqual(await guides().fetchPlayTogetherPosts(), {
    en: [{ ...connect4, href: `${BLOG_ORIGIN}/blog/play-connect-4-online` }],
    tr: [{ ...connect4Tr, href: `${BLOG_ORIGIN}/tr/blog/online-connect-4-oyna` }],
  });
});

test("a reader sees the guides written in their own language", () => {
  const { guidesFor } = guides();
  const posts = { en: [connect4], tr: [connect4Tr] };

  assert.deepEqual(guidesFor(posts, "tr"), { language: "tr", posts: [connect4Tr] });
  assert.deepEqual(guidesFor(posts, "en"), { language: "en", posts: [connect4] });
});

test("a language with no guides yet falls back to the English ones", () => {
  assert.deepEqual(guides().guidesFor({ en: [connect4] }, "es"), {
    language: "en",
    posts: [connect4],
  });
});

test("no guides anywhere leaves nothing to show", () => {
  assert.deepEqual(guides().guidesFor({}, "tr"), { language: "en", posts: [] });
});

test("live: Sanity answers the guides query", live, async (t) => {
  const errors = errorsLogged(t);

  const posts = await guides().fetchPlayTogetherPosts();

  assert.equal(errors.callCount(), 0, `the request failed: ${errors.calls[0]?.arguments[0]}`);
  assert.ok(posts.en?.length > 0, "the English guides are missing");
  for (const post of posts.en) {
    assert.ok(post.title, "a guide came back without a title");
    assert.equal(post.href, `${BLOG_ORIGIN}/blog/${post.slug}`);
  }
});

// ---------------------------------------------------------------------------
// The "read" slides of the home carousel
// ---------------------------------------------------------------------------

/** A carousel slide that points at a blog post, as Sanity returns it. */
const readSlide = (post) => ({ _id: "slide-1", source: "read", title: { en: "A guide" }, post });

const chess = { language: "en", slug: "play-chess-online" };
const chessTr = { language: "tr", slug: "online-satranc-oyna" };

const actionOfSlide = async () => (await carousel().fetchDiscoverFeed())[0].action;

test("a read slide opens the post in the reader's own language", async (t) => {
  sanityAnswers(t, [readSlide({ ...chess, versions: [chess, chessTr] })]);

  assert.deepEqual(await actionOfSlide(), {
    kind: "link",
    href: `${BLOG_ORIGIN}/blog/play-chess-online`,
    hrefByLocale: {
      en: `${BLOG_ORIGIN}/blog/play-chess-online`,
      tr: `${BLOG_ORIGIN}/tr/blog/online-satranc-oyna`,
    },
    external: true,
  });
});

test("a post that exists in one language has one address", async (t) => {
  sanityAnswers(t, [readSlide({ ...chess, versions: null })]);

  assert.deepEqual(await actionOfSlide(), {
    kind: "link",
    href: `${BLOG_ORIGIN}/blog/play-chess-online`,
    external: true,
  });
});

test("a translation that is not published yet is left out", async (t) => {
  // Sanity resolves a reference to an unpublished document as null.
  sanityAnswers(t, [readSlide({ ...chess, versions: [chess, null] })]);

  assert.deepEqual(await actionOfSlide(), {
    kind: "link",
    href: `${BLOG_ORIGIN}/blog/play-chess-online`,
    external: true,
  });
});

test("a slide pointing at a Turkish post links into the Turkish blog", async (t) => {
  sanityAnswers(t, [readSlide({ ...chessTr, versions: null })]);

  assert.equal((await actionOfSlide()).href, `${BLOG_ORIGIN}/tr/blog/online-satranc-oyna`);
});

test("pressing a read slide goes to the reader's language, then English, then the slide's own post", async (t) => {
  // The slide points at the Turkish post, which also exists in English.
  sanityAnswers(t, [readSlide({ ...chessTr, versions: [chess, chessTr] })]);
  const translated = await actionOfSlide();
  const turkishOnly = { kind: "link", href: `${BLOG_ORIGIN}/tr/blog/online-satranc-oyna` };
  const { hrefOf } = text();

  assert.equal(hrefOf(translated, "tr"), `${BLOG_ORIGIN}/tr/blog/online-satranc-oyna`);
  assert.equal(hrefOf(translated, "en"), `${BLOG_ORIGIN}/blog/play-chess-online`);
  // Nobody has written it in Spanish, so a Spanish reader gets the English one.
  assert.equal(hrefOf(translated, "es"), `${BLOG_ORIGIN}/blog/play-chess-online`);
  // Nothing but Turkish exists: better the post in Turkish than no post.
  assert.equal(hrefOf(turkishOnly, "en"), `${BLOG_ORIGIN}/tr/blog/online-satranc-oyna`);
});

test("live: Sanity answers the carousel query", live, async (t) => {
  const errors = errorsLogged(t);

  const slides = await carousel().fetchDiscoverFeed();

  assert.equal(errors.callCount(), 0, `the request failed: ${errors.calls[0]?.arguments[0]}`);
  for (const { action } of slides) {
    if (action.kind !== "link") continue;
    assert.match(action.href, /\/blog\/[^/]+$/, "a read slide has no post address");
  }
});
