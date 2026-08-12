"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { LuArrowRight, LuChevronLeft, LuChevronRight, LuGamepad2, LuPlay } from "react-icons/lu";
import { ImSpinner2 } from "react-icons/im";

import { useI18n, useTranslations } from "@/i18n/I18nProvider";
import { trackDiscoverSlideViewed } from "@/lib/analytics";
import { fitOf, isBoosted, orderSlides, textOf, type DiscoverSlide } from "@/lib/discover";
import {
  dashDiscoverArrowClass,
  dashDiscoverArrowsClass,
  dashDiscoverArtClass,
  dashDiscoverArtFramedClass,
  dashDiscoverBackdropClass,
  dashDiscoverCopyClass,
  dashDiscoverCtaClass,
  dashDiscoverDescClass,
  dashDiscoverDotsClass,
  dashDiscoverEyebrowClass,
  dashDiscoverFrameClass,
  dashDiscoverMetaClass,
  dashDiscoverSlideClass,
  dashDiscoverTitleClass,
  dashSurfaceHex as SURFACE,
} from "@/components/UI/classTokens";
import { useDiscoverAction } from "./useDiscoverAction";
import { useResolvedSlides } from "./useResolvedSlides";

const AUTOPLAY_MS = 6000;
/** Past this it stops being a hero and becomes a list. */
const MAX_SLIDES = 8;

/**
 * The home hero: a rotating answer to "what could we do together right now".
 *
 * Games, videos, articles and gifts are all the same kind of slide here on purpose —
 * one layout, one rhythm, no section headings. Nothing in this file knows what any
 * particular slide points at; that lives in the action, and the words live in the CMS.
 */
export function DiscoverCarousel({ slides }: { slides: DiscoverSlide[] }) {
  const { locale } = useI18n();
  const t = useTranslations("home");
  const resolved = useResolvedSlides(slides);
  const { run, pending } = useDiscoverAction();

  const [emblaRef, embla] = useEmblaCarousel({ loop: true, align: "start" });
  const [selected, setSelected] = useState(0);
  const [paused, setPaused] = useState(false);

  const ordered = useMemo(
    () => orderSlides(resolved, { limit: MAX_SLIDES }),
    [resolved],
  );

  useEffect(() => {
    if (!embla) return;
    const onSelect = () => setSelected(embla.selectedScrollSnap());
    onSelect();
    embla.on("select", onSelect);
    return () => {
      embla.off("select", onSelect);
    };
  }, [embla]);

  useEffect(() => {
    if (!embla || paused || ordered.length < 2) return;
    // Somebody who has asked for less motion should not be handed a carousel that
    // moves on its own; they can still swipe and press the arrows.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timer = setInterval(() => embla.scrollNext(), AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [embla, paused, selected, ordered.length]);

  const scrollTo = useCallback((index: number) => embla?.scrollTo(index), [embla]);

  /**
   * Report the slide in front, once each.
   *
   * Deduping for the life of the page is the whole mechanism, and it is enough on its
   * own: autoplay would otherwise report a view every six seconds for as long as a tab
   * is left open, and the click-through rate would drown in whoever walked away from
   * their desk. With the set, a page left open all afternoon reports at most one view
   * per slide.
   *
   * Deliberately no `document.hidden` check on top of that. It reads like an
   * improvement — a carousel nobody is looking at is not a view — but the count is
   * already bounded, and any environment that misreports visibility would silently
   * swallow every view instead of over-reporting a handful.
   */
  const seen = useRef(new Set<string>());

  useEffect(() => {
    const slide = ordered[selected];
    if (!slide || seen.current.has(slide.id)) return;

    seen.current.add(slide.id);
    trackDiscoverSlideViewed({
      slideId: slide.id,
      category: slide.category,
      position: selected,
      action: slide.action.kind,
      boosted: isBoosted(slide),
    });
  }, [ordered, selected]);

  if (ordered.length === 0) return null;

  return (
    <section
      className={dashDiscoverFrameClass}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {ordered.map((slide, index) => {
            const framed = fitOf(slide) === "contain";
            const art = slide.media.src;
            const accent = slide.accent ?? "#e11d48";
            const opening = pending === slide.id;
            const isGame = slide.action.kind === "game";

            return (
              <div key={slide.id} className={dashDiscoverSlideClass}>
                {art ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={art} alt="" aria-hidden="true" className={dashDiscoverBackdropClass} />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={art}
                      alt=""
                      width={slide.media.width}
                      height={slide.media.height}
                      // Only the first slide is on screen at load; the rest can wait.
                      loading={index === 0 ? "eager" : "lazy"}
                      decoding="async"
                      className={`${dashDiscoverArtClass} ${
                        framed ? dashDiscoverArtFramedClass : "object-cover"
                      } ${selected === index ? "scale-[1.06]" : "scale-100"}`}
                    />
                  </>
                ) : (
                  // No art anywhere in the chain. Render the accent plainly rather than
                  // inventing a picture for it.
                  <div
                    className="absolute inset-0 flex items-center justify-center"
                    style={{
                      background: `radial-gradient(120% 100% at 70% 10%, ${accent}33, ${SURFACE} 70%)`,
                    }}
                  >
                    <LuGamepad2 size={46} style={{ color: accent }} />
                  </div>
                )}

                {/* Both scrims weighted to the bottom-left where the words are, so the
                    top two thirds of every picture stays untouched. */}
                <div
                  className="pointer-events-none absolute inset-0 max-[760px]:hidden"
                  style={{
                    background: `linear-gradient(to top, ${SURFACE} 0%, ${SURFACE}e6 18%, ${SURFACE}73 42%, transparent 72%)`,
                  }}
                />
                <div
                  className="pointer-events-none absolute inset-0 hidden max-[760px]:block"
                  style={{
                    background: `linear-gradient(to top, ${SURFACE} 0%, ${SURFACE}f2 28%, ${SURFACE}a6 52%, ${SURFACE}40 70%, transparent 88%)`,
                  }}
                />
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background: `radial-gradient(760px 380px at 2% 104%, ${accent}33, transparent 60%)`,
                  }}
                />

                <div className={dashDiscoverCopyClass}>
                  <span className={dashDiscoverEyebrowClass}>
                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: accent }} />
                    {textOf(slide.eyebrow, locale) ||
                      t(isBoosted(slide) ? "discover.new" : `discover.${slide.category}`)}
                  </span>

                  <h2 className={dashDiscoverTitleClass}>{textOf(slide.title, locale)}</h2>

                  {textOf(slide.description, locale) ? (
                    <p className={dashDiscoverDescClass}>{textOf(slide.description, locale)}</p>
                  ) : null}

                  <div className="mt-1 flex items-center gap-3">
                    <button
                      type="button"
                      disabled={pending !== null}
                      onClick={() => run(slide, index)}
                      className={dashDiscoverCtaClass}
                    >
                      {opening ? (
                        <ImSpinner2 className="animate-spin text-[13px]" />
                      ) : isGame ? (
                        <LuPlay className="text-[13px]" />
                      ) : (
                        <LuArrowRight className="text-[13px]" />
                      )}
                      {opening
                        ? t("starting")
                        : textOf(slide.ctaLabel, locale) || t(`discover.cta.${slide.action.kind}`)}
                    </button>
                    {textOf(slide.meta, locale) ? (
                      <span className={dashDiscoverMetaClass}>{textOf(slide.meta, locale)}</span>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {ordered.length > 1 ? (
        <>
          {/* The active dot fills over the autoplay window, so the thing about to
              happen is visible rather than a surprise. */}
          <div className={dashDiscoverDotsClass}>
            {ordered.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                aria-label={textOf(slide.title, locale)}
                onClick={() => scrollTo(index)}
                className={`h-1.5 overflow-hidden rounded-full transition-all duration-300 ${
                  selected === index ? "w-8 bg-white/25" : "w-1.5 bg-white/30 hover:bg-white/50"
                }`}
              >
                {selected === index ? (
                  <span
                    key={`${slide.id}-${selected}-${paused}`}
                    className="block h-full rounded-full bg-white/90"
                    style={{
                      animation: paused
                        ? "none"
                        : `discoverFill ${AUTOPLAY_MS}ms linear forwards`,
                      width: paused ? "100%" : undefined,
                    }}
                  />
                ) : null}
              </button>
            ))}
          </div>

          <div className={dashDiscoverArrowsClass}>
            <button
              type="button"
              aria-label={t("discover.previous")}
              onClick={() => embla?.scrollPrev()}
              className={dashDiscoverArrowClass}
            >
              <LuChevronLeft />
            </button>
            <button
              type="button"
              aria-label={t("discover.next")}
              onClick={() => embla?.scrollNext()}
              className={dashDiscoverArrowClass}
            >
              <LuChevronRight />
            </button>
          </div>
        </>
      ) : null}

      <style>{`@keyframes discoverFill { from { width: 0% } to { width: 100% } }`}</style>
    </section>
  );
}

export default DiscoverCarousel;
