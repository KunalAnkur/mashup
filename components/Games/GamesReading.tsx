"use client";

import { useTranslations } from "@/i18n/I18nProvider";
import type { PlayTogetherPost } from "@/lib/blog/playTogether";
import { BLOG_ORIGIN } from "@/lib/discover/feed";
import {
  dashGamesCatalogGridClass,
  dashGuideCardClass,
  dashGuideCardCoverClass,
  dashGuideCardCoverImgClass,
  dashGuideCardExcerptClass,
  dashGuideCardMetaClass,
  dashGuideCardTitleClass,
  dashSectionHeadClass,
  dashSectionHeadLinkClass,
  dashSectionHeadTitleClass,
} from "@/components/UI/classTokens";

/**
 * Guides for the games above, from the blog.
 *
 * A client component only because the heading needs `useTranslations`; the posts
 * themselves are fetched on the server and passed in, so they are in the first HTML and
 * the section never appears late and pushes the catalogue up.
 *
 * Renders nothing at all when there are no posts — which is also what happens when
 * Sanity is unreachable. An absent section is invisible; an empty titled one is a bug
 * the visitor can see.
 */
export function GamesReading({ posts }: { posts: PlayTogetherPost[] }) {
  const t = useTranslations("games");

  if (posts.length === 0) return null;

  return (
    <section>
      <div className={dashSectionHeadClass}>
        <h2 className={dashSectionHeadTitleClass}>{t("reading.title")}</h2>
        {/* A plain anchor, not next/link: the blog is a different origin to the app. */}
        <a
          href={`${BLOG_ORIGIN}/blog`}
          target="_blank"
          rel="noopener noreferrer"
          className={dashSectionHeadLinkClass}
        >
          {t("reading.viewAll")}
        </a>
      </div>

      <div className={dashGamesCatalogGridClass}>
        {posts.map((post) => (
          <a
            key={post.slug}
            href={post.href}
            target="_blank"
            rel="noopener noreferrer"
            className={dashGuideCardClass}
          >
            {post.imageUrl ? (
              <div className={dashGuideCardCoverClass}>
                {/* A plain img, like the Discover carousel does for this same CDN:
                    cdn.sanity.io is not in next.config's remotePatterns, and it does not
                    need to be — Sanity resizes on request, so the URL already asks for
                    the width and format this card wants. The cover's fixed aspect ratio
                    reserves the box, so there is no shift when the image lands. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={post.imageUrl}
                  alt=""
                  aria-hidden="true"
                  loading="lazy"
                  decoding="async"
                  className={dashGuideCardCoverImgClass}
                />
              </div>
            ) : null}

            <div className={dashGuideCardMetaClass}>
              <h3 className={dashGuideCardTitleClass}>{post.title}</h3>
              {post.excerpt ? (
                <p className={dashGuideCardExcerptClass}>{post.excerpt}</p>
              ) : null}
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
