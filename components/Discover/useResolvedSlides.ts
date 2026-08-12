"use client";

import { useMemo } from "react";
import { getCatalog } from "@movmash/arcade-client";

import { useI18n } from "@/i18n/I18nProvider";
import { useGetProductsQuery } from "@/lib/store/api/productApi";
import { coverOf } from "@/components/Games/cover";
import type { DiscoverSlide } from "@/lib/discover";

/**
 * Fills in everything the author did not type.
 *
 * The CMS holds a reference — a game id, a product id — and the app owns what that
 * refers to. Resolving here rather than in the feed keeps the server request to one
 * call: the catalog is already compiled into this bundle and the product list is
 * already fetched for the rail below, so neither costs a round trip.
 *
 * An author's own value always wins. Everything below is a default for a field that was
 * left empty.
 */
export function useResolvedSlides(slides: DiscoverSlide[]): DiscoverSlide[] {
  const { locale } = useI18n();
  const { data: products } = useGetProductsQuery();

  return useMemo(() => {
    const catalog = getCatalog({ locale, includeLocked: true });

    return slides
      .map((slide): DiscoverSlide | null => {
        if (slide.action.kind === "game") {
          const entry = catalog.find((game) => game.gameId === (slide.action as { gameId: string }).gameId);
          // A game pulled from the catalogue takes its slide with it rather than
          // rendering a card that opens a room nothing can play.
          if (!entry) return null;

          const cover = coverOf(entry.presentation);
          return {
            ...slide,
            title: hasText(slide.title) ? slide.title : { en: entry.title },
            description: slide.description ?? { en: entry.tagline },
            meta: slide.meta ?? { en: playersOf(entry.players) },
            accent: slide.accent ?? entry.presentation?.accent,
            media: {
              ...slide.media,
              src: slide.media.src ?? cover?.src,
              width: slide.media.width ?? cover?.width,
              height: slide.media.height ?? cover?.height,
            },
          };
        }

        // The feed cannot resolve a product — the list lives here — so it parks the id
        // in the href and this swaps in the real one.
        const productId = productIdOf(slide);
        if (productId) {
          const product = products?.find((item) => item.id === productId);
          if (!product) return null;

          return {
            ...slide,
            title: hasText(slide.title) ? slide.title : { en: product.name },
            meta: slide.meta ?? { en: product.price },
            action: { kind: "link", href: product.href, external: true },
            media: { ...slide.media, src: slide.media.src ?? product.images[0] },
          };
        }

        return slide;
      })
      .filter((slide): slide is DiscoverSlide => slide !== null);
  }, [slides, locale, products]);
}

const PRODUCT_HREF = /^#product:(.+)$/;

function productIdOf(slide: DiscoverSlide): string | null {
  if (slide.action.kind !== "link") return null;
  return PRODUCT_HREF.exec(slide.action.href)?.[1] ?? null;
}

const hasText = (value: DiscoverSlide["title"]) =>
  Object.values(value).some((text) => text?.trim());

const playersOf = ({ min, max }: { min: number; max: number }) =>
  min === max ? `${min} players` : `${min}–${max} players`;
