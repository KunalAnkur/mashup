import { Product as StoreProduct } from "@/types/storeTypes";

export type ProductPlacement = "host-empty" | "viewer-waiting" | "host-left";

export type Product = StoreProduct;

export type ProductCarouselProps = {
  placement: ProductPlacement;
};

export type ProductCardTracking = {
  surface: "carousel" | "bottom_sheet";
  placement?: ProductPlacement;
  position: number;
};

export type CardArt = {
  hero: string;
  glow: string;
};

export const CARD_ART_STYLES: CardArt[] = [
  {
    hero: "linear-gradient(135deg, rgba(244,63,94,.56) 0%, rgba(217,70,239,.4) 48%, rgba(168,85,247,.48) 100%)",
    glow: "radial-gradient(circle at 72% 22%, rgba(253,164,175,.58), transparent 50%)",
  },
  {
    hero: "linear-gradient(135deg, rgba(245,158,11,.56) 0%, rgba(249,115,22,.42) 48%, rgba(236,72,153,.36) 100%)",
    glow: "radial-gradient(circle at 72% 22%, rgba(251,191,36,.58), transparent 50%)",
  },
  {
    hero: "linear-gradient(135deg, rgba(14,165,233,.56) 0%, rgba(6,182,212,.4) 48%, rgba(99,102,241,.42) 100%)",
    glow: "radial-gradient(circle at 72% 22%, rgba(125,211,252,.58), transparent 50%)",
  },
  {
    hero: "linear-gradient(135deg, rgba(139,92,246,.56) 0%, rgba(168,85,247,.4) 48%, rgba(236,72,153,.4) 100%)",
    glow: "radial-gradient(circle at 72% 22%, rgba(196,181,253,.58), transparent 50%)",
  },
];

export const COPY_BY_PLACEMENT = {
  "host-empty": {
    title: "Set the vibe 🎬",
    subtitle: "Pick something to watch or explore ideas to make it special.",
  },
  "viewer-waiting": {
    title: "Something for you two 👀",
    subtitle: "While you wait, explore cute finds and little surprises.",
  },
  "host-left": {
    title: "Make the moment yours ❤️",
    subtitle: "Start something, or find a little surprise to share later.",
  },
};