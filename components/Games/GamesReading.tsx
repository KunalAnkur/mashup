"use client";

import { isRtlLocale } from "@/i18n/config";
import { useLocale, useTranslations } from "@/i18n/I18nProvider";
import { guidesFor, type PlayTogetherPosts } from "@/lib/blog/playTogether";
import { blogHref } from "@/lib/discover/feed";
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
 * A client component because the heading needs `useTranslations` and the guides are
 * picked by the reader's language; the posts themselves are fetched on the server and
 * passed in — every language's — so they arrive with the page and the section never
 * appears late and pushes the catalogue up.
 *
 * Renders nothing at all when there are no posts — which is also what happens when
 * Sanity is unreachable. An absent section is invisible; an empty titled one is a bug
 * the visitor can see.
 */
export function GamesReading({ posts }: { posts: PlayTogetherPosts }) {
  const t = useTranslations("games");
  const { language, posts: guides } = guidesFor(posts, useLocale());

  if (guides.length === 0) return null;

  return (
    <section>
      <div className={dashSectionHeadClass}>
        <h2 className={dashSectionHeadTitleClass}>{t("reading.title")}</h2>
        {/* A plain anchor, not next/link: the blog is a different origin to the app. */}
        <a
          href={blogHref(language)}
          target="_blank"
          rel="noopener noreferrer"
          className={dashSectionHeadLinkClass}
        >
          {t("reading.viewAll")}
        </a>
      </div>

      <div className={dashGamesCatalogGridClass}>
        {guides.map((post) => (
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

            {/* The guides can be English on a page that is not. Their words keep their
                own language and direction: on the Arabic page the clamp's "…" otherwise
                lands at the wrong end and eats the start of the second line. */}
            <div
              className={dashGuideCardMetaClass}
              lang={language}
              dir={isRtlLocale(language) ? "rtl" : "ltr"}
            >
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
