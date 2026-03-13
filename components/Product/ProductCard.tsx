import { useCallback, useEffect, useMemo, useState } from "react";
import { CARD_ART_STYLES, CardArt, Product } from "./type";
import useEmblaCarousel from "embla-carousel-react";
import { LuChevronLeft, LuChevronRight, LuExternalLink } from "react-icons/lu";

export const ProductCard = ({
    product,
    art,
}: {
    product: Product;
    art: CardArt;
}) => {
    const images = useMemo(
        () => product.images.filter((url) => typeof url === "string" && url.trim()),
        [product.images]
    );
    const [imageEmblaRef, imageEmblaApi] = useEmblaCarousel({
        align: "start",
        dragFree: false,
        containScroll: "trimSnaps",
        loop: images.length > 1,
    });
    const [imageIndex, setImageIndex] = useState(0);
    const [canImagePrev, setCanImagePrev] = useState(false);
    const [canImageNext, setCanImageNext] = useState(false);
    const [failedImageMap, setFailedImageMap] = useState<Record<number, boolean>>({});

    const onImageSelect = useCallback(() => {
        if (!imageEmblaApi) return;
        setImageIndex(imageEmblaApi.selectedScrollSnap());
        setCanImagePrev(imageEmblaApi.canScrollPrev());
        setCanImageNext(imageEmblaApi.canScrollNext());
    }, [imageEmblaApi]);

    useEffect(() => {
        setImageIndex(0);
        setFailedImageMap({});
    }, [product.id, images.length]);

    useEffect(() => {
        if (!imageEmblaApi) return;
        onImageSelect();
        imageEmblaApi.on("select", onImageSelect);
        imageEmblaApi.on("reInit", onImageSelect);
        return () => {
            imageEmblaApi.off("select", onImageSelect);
            imageEmblaApi.off("reInit", onImageSelect);
        };
    }, [imageEmblaApi, onImageSelect]);

    // Derive badge accent from art glow color
    const badgeVariants: Record<number, string> = {
        0: "bg-violet-600/50 text-violet-200 border-violet-500/30",   // purple/rose
        1: "bg-pink-700/45 text-pink-200 border-pink-500/25",         // amber/orange
        2: "bg-cyan-700/45 text-cyan-200 border-cyan-500/25",         // sky/indigo
        3: "bg-violet-700/45 text-purple-200 border-purple-500/25",   // purple/pink
    };
    const artIndex = CARD_ART_STYLES.indexOf(art);
    const badgeCls = badgeVariants[artIndex % 4] ?? badgeVariants[0];

    return (
        <article className="group block overflow-hidden rounded-2xl border border-white/[0.09] bg-gradient-to-b from-white/[0.055] to-white/[0.018] transition-all duration-300 hover:-translate-y-[3px] hover:border-white/[0.18]">
            {/* ── Hero ── */}
            <div className="relative h-28 overflow-hidden border-b border-white/[0.07]">
                <div className="absolute inset-0" style={{ background: art.hero }} />
                <div className="absolute inset-0" style={{ background: art.glow }} />

                {images.length > 0 && (
                    <div className="absolute inset-0 overflow-hidden" ref={imageEmblaRef}>
                        <div className="flex h-full">
                            {images.map((image, index) => (
                                <div key={`${product.id}-${index}`} className="min-w-0 flex-[0_0_100%]">
                                    {!failedImageMap[index] && (
                                        <img
                                            src={image}
                                            alt={`${product.name} image ${index + 1}`}
                                            className="h-full w-full object-cover"
                                            loading="lazy"
                                            onError={() =>
                                                setFailedImageMap((prev) => ({ ...prev, [index]: true }))
                                            }
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Bottom fade */}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/65 to-transparent" />

                {/* Category pill */}
                <div className="absolute left-2.5 top-2.5 rounded-full border border-white/20 bg-black/40 px-2.5 py-1 text-[10px] font-medium text-white/82 backdrop-blur-sm">
                    {product.category}
                </div>

                {/* Rating pill */}
                <div className="absolute right-2.5 top-2.5 rounded-full bg-white/92 px-2 py-1 text-[10px] font-semibold text-black/80">
                    {product.rating} ★
                </div>

                {/* Deal badge — accent color matched to art */}
                <div className={`absolute bottom-2.5 left-2.5 rounded-full border px-2.5 py-1 text-[9.5px] font-semibold tracking-wide backdrop-blur-sm ${badgeCls}`}>
                    {product.badge}
                </div>

                {/* Multi-image nav */}
                {images.length > 1 && (
                    <>
                        <button
                            type="button"
                            onClick={() => imageEmblaApi?.scrollPrev()}
                            disabled={!canImagePrev}
                            className="absolute left-2 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white/90 transition hover:bg-black/55 disabled:opacity-30"
                            aria-label="Previous image"
                        >
                            <LuChevronLeft size={12} />
                        </button>
                        <button
                            type="button"
                            onClick={() => imageEmblaApi?.scrollNext()}
                            disabled={!canImageNext}
                            className="absolute right-2 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white/90 transition hover:bg-black/55 disabled:opacity-30"
                            aria-label="Next image"
                        >
                            <LuChevronRight size={12} />
                        </button>
                        <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1">
                            {images.map((_, idx) => (
                                <button
                                    key={`${product.id}-dot-${idx}`}
                                    type="button"
                                    onClick={() => imageEmblaApi?.scrollTo(idx)}
                                    aria-label={`Go to image ${idx + 1}`}
                                    className={`h-[5px] rounded-full transition-all ${imageIndex === idx ? "w-3.5 bg-white/90" : "w-[5px] bg-white/45"
                                        }`}
                                />
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* ── Body ── */}
            <div className="bg-white/[0.025] px-3 py-2.5">
                <div className="flex items-baseline justify-between gap-2">
                    <p className="line-clamp-1 text-[13px] font-medium text-white/92">
                        {product.name}
                    </p>
                    {/* Price gets the purple→pink gradient accent */}
                    <span className="shrink-0 bg-gradient-to-r from-violet-300 to-pink-300 bg-clip-text text-[13px] font-semibold text-transparent">
                        {product.price}
                    </span>
                </div>
                <div className="mt-1 flex items-center justify-between gap-2">
                    <p className="line-clamp-1 text-[10px] text-white/38">{product.meta}</p>

                <a href={product.href} target="_blank" rel="noopener noreferrer" className="inline-flex shrink-0 items-center gap-1 text-[10px] text-white/48 transition hover:text-white/90">
                    View
                    <LuExternalLink size={10} />
                </a>
            </div>
        </div>
    </article >
  );
};