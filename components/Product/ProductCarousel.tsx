"use client";

import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { LuChevronLeft, LuChevronRight } from "react-icons/lu";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import { useGetProductsQuery } from "@/lib/store/api/productApi";
import {
  setProductError,
  setProductLoading,
  setProducts,
} from "@/lib/store/slices/productSlice";
import { CARD_ART_STYLES, COPY_BY_PLACEMENT, ProductCarouselProps } from "./type";
import { ProductCard } from "./ProductCard";
import { FiChevronUp } from "react-icons/fi";
import { toggleBottomSheet } from "@/lib/store/slices/roomSlice";

const ProductCarousel = ({ placement }: ProductCarouselProps) => {
  const dispatch = useDispatch();
  const products = useSelector((state: RootState) => state.product.items);
  const bottomSheetIsOpen = useSelector(
    (state: RootState) => state.room.settings.bottomSheet
  );
  const {
    data: productData,
    isLoading: queryLoading,
    isFetching: queryFetching,
    isError: queryIsError,
  } = useGetProductsQuery();

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
    dispatch(setProductLoading(queryLoading || queryFetching));
  }, [dispatch, queryLoading, queryFetching]);

  useEffect(() => {
    if (productData) {
      dispatch(setProducts(productData));
    }
  }, [dispatch, productData]);

  useEffect(() => {
    dispatch(setProductError(queryIsError ? "Could not load products." : null));
  }, [dispatch, queryIsError]);

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
    <section className="w-full max-w-[1210px] px-2 md:px-6">
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0" />

        <div className="relative mb-1.5 flex items-center justify-between gap-2 md:mb-3 md:gap-3">
          <div>
            <h3 className="mt-0.5 text-[11.5px] font-semibold leading-tight text-white/90 md:mt-1 md:text-[17px]">
              {COPY_BY_PLACEMENT[placement].title}
            </h3>
            <p className="mt-0.5 text-[9px] text-white/45 max-[768px]:hidden md:text-xs">
              {COPY_BY_PLACEMENT[placement].subtitle}
            </p>
          </div>

          <div className="hidden items-center gap-2 md:flex">
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
          <div className="-ml-1.5 flex touch-pan-y md:-ml-3">
            {products.map((product, index) => {
              const art = CARD_ART_STYLES[index % CARD_ART_STYLES.length];
              return (
                <div
                  key={`${product.id}-${index}`}
                  className="min-w-0 w-1/2 flex-none pl-1.5 md:w-2/5 md:pl-3 lg:w-1/4"
                >
                  <ProductCard product={product} art={art} />
                </div>
              );
            })}
          </div>
        </div>

        {products.length > 0 ? (
          <div className="mt-1.5 hidden items-center justify-end gap-1 md:mt-3 md:flex md:gap-1.5">
            {scrollSnaps.map((_, index) => (
              <button
                key={index}
                type="button"
                aria-label={`Go to product set ${index + 1}`}
                onClick={() => emblaApi?.scrollTo(index)}
                className={`h-2 rounded-full transition-all ${
                  index === selectedIndex
                    ? "w-5 bg-white/90 md:w-6"
                    : "w-1.5 bg-white/35 hover:bg-white/55 md:w-2"
                }`}
              />
            ))}
          </div>
        ) : null}

        <div className="relative mt-3 flex flex-col items-center justify-center text-center text-[9px] text-white/45 md:mt-2 md:text-[10px]">
          {/* {isLoading
            ? "Loading products..."
            : productError
              ? productError
              : products.length === 0
                ? "No products available right now."
                : "Live product feed connected."} */}
          <button
            type="button"
            onClick={() => dispatch(toggleBottomSheet())}
            aria-expanded={bottomSheetIsOpen}
            aria-controls="product-bottom-sheet"
            className="group relative flex flex-col items-center justify-center gap-0.5 cursor-pointer"
          >
            <FiChevronUp
              size={16}
              className={`
              transition-transform duration-500 ease-in-out
              ${bottomSheetIsOpen ? "rotate-180" : "rotate-0"}
              ${!bottomSheetIsOpen ? "animate-bounce-subtle" : ""}
              group-hover:scale-125
              text-neutral-400 group-hover:text-white md:h-5 md:w-5
            `}
                    />
                    <span
                      className={`
              text-[9px] font-medium tracking-widest uppercase md:text-[11px]
              transition-all duration-300
              hidden
              md:contents
              text-neutral-400 group-hover:text-white
              ${!bottomSheetIsOpen ? "animate-pulse-soft" : "opacity-60"}
            `}
            >
              {bottomSheetIsOpen ? "see less" : "see more"}
            </span>
          </button>
        </div>
        
      </div>
    </section>
  );
};

export default ProductCarousel;
