"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import {
  LuChevronLeft,
  LuChevronRight,
  LuExternalLink,
  LuSparkles,
} from "react-icons/lu";
import { CARD_ART_STYLES, CardArt, COPY_BY_PLACEMENT, Product, ProductCarouselProps, ProductPlacement } from "./type";
import { ProductCard } from "./ProductCard";


const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8989";



function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toStringValue(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return "";
}

function normalizeImageList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => toStringValue(item).trim())
      .filter((item) => item.length > 0);
  }

  const oneImage = toStringValue(value).trim();
  return oneImage ? [oneImage] : [];
}

function normalizeProducts(payload: unknown): Product[] {
  let rawProducts: unknown[] = [];

  if (Array.isArray(payload)) {
    rawProducts = payload;
  } else if (isRecord(payload)) {
    if (Array.isArray(payload.data)) {
      rawProducts = payload.data;
    } else if (isRecord(payload.data) && Array.isArray(payload.data.items)) {
      rawProducts = payload.data.items;
    } else if (Array.isArray(payload.items)) {
      rawProducts = payload.items;
    }
  }

  return rawProducts
    .filter((item): item is Record<string, unknown> => isRecord(item))
    .map((item) => ({
      id: toStringValue(item.id),
      name: toStringValue(item.name),
      price: toStringValue(item.price),
      images: normalizeImageList(item.images),
      category: toStringValue(item.category),
      badge: toStringValue(item.badge),
      rating: toStringValue(item.rating),
      meta: toStringValue(item.meta),
      href: toStringValue(item.href),
      surface: toStringValue(item.surface),
      glow: toStringValue(item.glow),
    }))
    .filter((item) => item.id && item.name);
}



const ProductCarousel = ({ placement }: ProductCarouselProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    dragFree: false,
    containScroll: "trimSnaps",
    loop: products.length > 4,
  });

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  useEffect(() => {
    const abortController = new AbortController();

    const fetchProducts = async () => {
      setIsLoading(true);
      setIsError(false);

      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/products`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          signal: abortController.signal,
          cache: "no-store",
        });

        if (!response.ok) throw new Error("Failed to fetch products");

        const payload = (await response.json()) as unknown;
        const normalizedProducts = normalizeProducts(payload);
        setProducts(normalizedProducts);
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
        setIsError(true);
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();

    return () => abortController.abort();
  }, []);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    setScrollSnaps(emblaApi.scrollSnapList());
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect, products.length]);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  return (
    <section className="w-full max-w-[1210px] px-3 sm:px-6">
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0" />

        <div className="relative mb-3 flex items-center justify-between gap-3 ">
          <div>
            <h3 className="mt-1 text-[17px] font-semibold leading-tight text-white/90">
              {COPY_BY_PLACEMENT[placement].title}
            </h3>
            <p className="mt-0.5 text-[11px] text-white/45 sm:text-xs">
              {COPY_BY_PLACEMENT[placement].subtitle}
            </p>
          </div>

          <div className="hidden items-center gap-2 sm:flex">
            <button
              type="button"
              onClick={scrollPrev}
              disabled={!canScrollPrev}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-black/30 text-white/80 transition hover:border-white/35 hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
              aria-label="Previous products"
            >
              <LuChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={scrollNext}
              disabled={!canScrollNext}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-black/30 text-white/80 transition hover:border-white/35 hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
              aria-label="Next products"
            >
              <LuChevronRight size={16} />
            </button>
          </div>
        </div>

        <div className="relative overflow-hidden" ref={emblaRef}>
          <div className="-ml-2.5 flex touch-pan-y sm:-ml-3">
            {products.map((product, index) => {
              const art = CARD_ART_STYLES[index % CARD_ART_STYLES.length];
              return (
                <div
                  key={`${product.id}-${index}`}
                  className="min-w-0 flex-[0_0_70%] pl-2.5 sm:flex-[0_0_42%] sm:pl-3 lg:flex-[0_0_25%]"
                >
                  <ProductCard product={product} art={art} />
                </div>
              );
            })}
          </div>
        </div>

        {products.length > 0 ? (
          <div className="mt-3 flex items-center justify-end gap-1.5">
            {scrollSnaps.map((_, index) => (
              <button
                key={index}
                type="button"
                aria-label={`Go to product set ${index + 1}`}
                onClick={() => emblaApi?.scrollTo(index)}
                className={`h-2 rounded-full transition-all ${
                  index === selectedIndex
                    ? "w-6 bg-white/90"
                    : "w-2 bg-white/35 hover:bg-white/55"
                }`}
              />
            ))}
          </div>
        ) : null}

        <div className="relative mt-2 text-center text-[10px] text-white/45">
          {isLoading
            ? "Loading products..."
            : isError
              ? "Could not load products."
              : products.length === 0
                ? "No products available right now."
                : "Live product feed connected."}
        </div>
      </div>
    </section>
  );
};

export default ProductCarousel;
