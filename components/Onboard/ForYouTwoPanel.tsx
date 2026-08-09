"use client";

import { LuArrowUpRight, LuGift } from "react-icons/lu";
import { useTranslations } from "@/i18n/I18nProvider";
import { useGetProductsQuery } from "@/lib/store/api/productApi";
import {
  dashPanelClass,
  dashProductLinkClass,
  dashProductNameClass,
  dashProductPriceClass,
  dashProductRowClass,
  dashProductTextColClass,
  dashProductThumbClass,
  dashProductThumbImgClass,
  dashSectionHeadClass,
  dashSectionHeadLinkClass,
  dashSectionHeadTitleClass,
} from "../UI/classTokens";

const SHOP_URL = "https://movmash.com/watch-party-shop";

// Same affiliate product feed shown in-room (components/Product/*, useGetProductsQuery) —
// real data, just laid out as the mockup's compact row list instead of the room's carousel.
const ForYouTwoPanel = () => {
  const t = useTranslations("home");
  const { data, isLoading } = useGetProductsQuery();
  const products = data?.slice(0, 4) ?? [];

  if (!isLoading && products.length === 0) return null;

  return (
    <div className={dashPanelClass}>
      <div className={dashSectionHeadClass}>
        <h2 className={dashSectionHeadTitleClass} style={{ fontSize: 14.5 }}>
          {t("forYouTwo")}
        </h2>
        <a href={SHOP_URL} target="_blank" rel="noopener noreferrer" className={dashSectionHeadLinkClass}>
          {t("seeAll")}
        </a>
      </div>

      {isLoading
        ? Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={dashProductRowClass}>
              <div className={`${dashProductThumbClass} animate-pulse`} />
              <div className="h-3 w-24 animate-pulse rounded bg-white/10" />
            </div>
          ))
        : products.map((product) => (
            <div key={product.id} className={dashProductRowClass}>
              <div className={dashProductThumbClass}>
                {product.images?.[0] ? (
                  <img src={product.images[0]} alt={product.name} className={dashProductThumbImgClass} />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-pink-600">
                    <LuGift size={18} />
                  </div>
                )}
              </div>
              <div className={dashProductTextColClass}>
                <div className={dashProductNameClass}>{product.name}</div>
                <div className={dashProductPriceClass}>{product.price}</div>
              </div>
              <a
                href={product.href}
                target="_blank"
                rel="noopener noreferrer"
                className={dashProductLinkClass}
              >
                <LuArrowUpRight size={12} />
              </a>
            </div>
          ))}
    </div>
  );
};

export default ForYouTwoPanel;
