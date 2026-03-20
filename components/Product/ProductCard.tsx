import { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import { trackProductOpened } from "@/lib/analytics/events";
import useEmblaCarousel from "embla-carousel-react";
import { LuChevronLeft, LuChevronRight, LuExternalLink } from "react-icons/lu";
import { CARD_ART_STYLES, CardArt, Product, ProductCardTracking } from "./type";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const LOCAL_IMAGE_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1"]);

const toRenderableImageUrl = (value: string): string => {
    const raw = value.trim();
    if (!raw || typeof window === "undefined") return raw;

    let apiOrigin: string | null = null;
    if (API_BASE_URL) {
        try {
            apiOrigin = new URL(API_BASE_URL).origin;
        } catch {
            apiOrigin = null;
        }
    }

    if (raw.startsWith("//")) return `${window.location.protocol}${raw}`;
    if (raw.startsWith("/")) {
        return apiOrigin ? `${apiOrigin}${raw}` : `${window.location.origin}${raw}`;
    }

    const hasScheme = /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(raw);
    if (!hasScheme) {
        if (!apiOrigin) return raw;
        return `${apiOrigin.replace(/\/$/, "")}/${raw.replace(/^\/+/, "")}`;
    }

    try {
        const parsed = new URL(raw);
        if (!LOCAL_IMAGE_HOSTS.has(parsed.hostname)) return parsed.toString();

        if (apiOrigin) {
            const target = new URL(apiOrigin);
            parsed.protocol = target.protocol;
            parsed.hostname = target.hostname;
            parsed.port = target.port;
            return parsed.toString();
        }

        parsed.hostname = window.location.hostname;
        return parsed.toString();
    } catch {
        return raw;
    }
};

export const ProductCard = ({
    product,
    art,
}: {
    product: Product;
    art: CardArt;
}) => {
    const roomId = useSelector((state: RootState) => state.room.roomId);
    const images = useMemo(
        () =>
            product.images
                .filter((url) => typeof url === "string" && url.trim())
                .map((url) => toRenderableImageUrl(url)),
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


    const handleProductClick = useCallback(() => {
        trackProductOpened({
            roomId,
            productId: product.id,
            productName: product.name,
            productCategory: product.category,
            productPrice: product.price,
            productBadge: product.badge,
            productHref: product.href,
        });
    }, [
        product.badge,
        product.category,
        product.href,
        product.id,
        product.name,
        product.price,
        roomId,
    ]);

    return (
        <article className="group block w-full overflow-hidden rounded-lg border border-white/[0.09] bg-gradient-to-b from-white/[0.055] to-white/[0.018] transition-all duration-300 hover:-translate-y-[3px] hover:border-white/[0.18] md:rounded-2xl">
            {/* ── Hero ── */}
            <div className="relative h-[62px] overflow-hidden border-b border-white/[0.07] md:h-28">
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
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/65 to-transparent" />

                {/* Category pill */}
                <div className="absolute left-2 top-2 rounded-full border border-white/20 bg-black/40 px-2 py-0.5 text-[8px] font-medium text-white/82 backdrop-blur-sm md:left-2.5 md:top-2.5 md:px-2.5 md:py-1 md:text-[10px]">
                    {product.category}
                </div>

                {/* Rating pill */}
                <div className="absolute right-2 top-2 rounded-full bg-white/92 px-1.5 py-0.5 text-[8.5px] font-semibold text-black/80 md:right-2.5 md:top-2.5 md:px-2 md:py-1 md:text-[10px]">
                    {product.rating} ★
                </div>

                {/* Deal badge — accent color matched to art */}
                <div className={`absolute bottom-2 left-2 rounded-full border px-2 py-0.5 text-[7.5px] font-semibold tracking-wide backdrop-blur-sm md:bottom-2.5 md:left-2.5 md:px-2.5 md:py-1 md:text-[9.5px] ${badgeCls}`}>
                    {product.badge}
                </div>

                {/* Multi-image nav */}
                {images.length > 1 && (
                    <>
                        <button
                            type="button"
                            onClick={() => imageEmblaApi?.scrollPrev()}
                            disabled={!canImagePrev}
                            className="absolute left-1.5 top-1/2 inline-flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white/90 transition hover:bg-black/55 disabled:opacity-30 md:left-2 md:h-6 md:w-6"
                            aria-label="Previous image"
                        >
                            <LuChevronLeft size={12} />
                        </button>
                        <button
                            type="button"
                            onClick={() => imageEmblaApi?.scrollNext()}
                            disabled={!canImageNext}
                            className="absolute right-1.5 top-1/2 inline-flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white/90 transition hover:bg-black/55 disabled:opacity-30 md:right-2 md:h-6 md:w-6"
                            aria-label="Next image"
                        >
                            <LuChevronRight size={12} />
                        </button>
                        <div className="absolute bottom-2 right-2 flex items-center gap-1 md:bottom-2.5 md:right-2.5">
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
            <div className="bg-white/[0.025] px-1.5 py-0.5 md:px-3 md:py-2.5">
                <div className="flex items-baseline justify-between gap-2">
                    <p className="line-clamp-1 text-[9.5px] font-medium text-white/92 md:text-[13px]">
                        {product.name}
                    </p>
                    {/* Price gets the purple→pink gradient accent */}
                    <span className="shrink-0 bg-gradient-to-r from-violet-300 to-pink-300 bg-clip-text text-[9.5px] font-semibold text-transparent md:text-[13px]">
                        {product.price}
                    </span>
                </div>
                <div className="mt-0.5 flex items-center justify-between gap-2 md:mt-1">
                    <p className="line-clamp-1 text-[7.5px] text-white/38 md:text-[10px]">{product.meta}</p>

                    <a
                        href={product.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={handleProductClick}
                        className="inline-flex shrink-0 items-center gap-1 text-[7.5px] text-white/48 transition hover:text-white/90 md:text-[10px]"
                    >
                        View
                        <LuExternalLink size={9} className="md:h-[10px] md:w-[10px]" />
                    </a>
                </div>
            </div>
        </article>
    );
};
