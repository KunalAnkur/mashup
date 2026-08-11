"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { getCatalog, type CatalogEntry } from "@movmash/arcade-client";
import { LuUsers, LuCrown, LuGamepad2 } from "react-icons/lu";
import { ImSpinner2 } from "react-icons/im";

import { RootState } from "@/lib/store";
import { useI18n, useTranslations } from "@/i18n/I18nProvider";
import { useOpenActivityRoom } from "@/components/Activity/useOpenActivityRoom";
import { trackCTAClicked } from "@/lib/analytics";
import {
  appSectionTitleTextClass,
  dashPageTitleWrapClass,
  dashPageContentWrapClass,
  dashPrimaryButtonClass,
} from "@/components/UI/classTokens";

// Same idea as GamesPreviewSection.tsx's home-page cards (and CARD_ART_STYLES in
// components/Product/type.ts) — catalog entries carry no bespoke art, so a cycling
// brand-gradient thumb band stands in for one, reused here for the full catalog page.
const THUMB_GRADIENTS = [
  "linear-gradient(135deg,#e11d48,#7c1d3a)",
  "linear-gradient(135deg,#db2777,#5c1236)",
  "linear-gradient(135deg,#c026d3,#5a1264)",
  "linear-gradient(135deg,#e11d48,#c026d3)",
];

const cardClass =
  "group relative flex flex-col overflow-hidden rounded-dashMd border border-dashBorder bg-dashSurface transition-colors duration-200";
const thumbClass = "relative flex h-28 items-center justify-center sm:h-32";
const bodyClass = "flex flex-col gap-3 p-5 text-start";
const badgeClass =
  "inline-flex items-center gap-1 rounded-full bg-dashSurfaceAlt px-2.5 py-1 text-[11px] font-medium text-dashTextMute";
const ctaClass = dashPrimaryButtonClass;

export default function GamesPage() {
  const router = useRouter();
  const { locale } = useI18n();
  const t = useTranslations("games");
  const subscription = useSelector((state: RootState) => state.subscription);
  const openActivityRoom = useOpenActivityRoom();
  const [opening, setOpening] = useState<string | null>(null);

  const tier = subscription?.subscription?.plan?.name?.toLowerCase().includes("free")
    ? "free"
    : subscription?.subscription
      ? "premium"
      : "free";

  /**
   * The gallery is built entirely from manifests. There is no list of games in this
   * file and there must never be one — a new game appears here by being registered in
   * arcade, with no change to costume at all.
   */
  const games = useMemo<CatalogEntry[]>(
    () => getCatalog({ locale, tier, includeLocked: true }),
    [locale, tier],
  );

  const handlePlay = (entry: CatalogEntry) => {
    if (entry.requiresUpgrade) {
      router.push("/pricing");
      return;
    }
    setOpening(entry.gameId);
    trackCTAClicked("games_start", { game_id: entry.gameId });
    openActivityRoom(entry.gameId);
  };

  return (
      <div className={dashPageContentWrapClass}>
          <div className={`mx-auto flex w-full max-w-5xl flex-col items-center`}>
          <div className={`${dashPageTitleWrapClass} justify-center`}>
            <h1 className={appSectionTitleTextClass}>{t("title")}</h1>
          </div>

              {games.length === 0 ? (
                <p className="py-16 text-center text-sm text-dashTextMute">{t("empty")}</p>
              ) : (
                // auto-fit with a capped track centres a single card and grids a full
                // catalogue evenly, without having to count items
                <div className="grid w-full justify-start gap-3 [grid-template-columns:repeat(auto-fit,minmax(260px,340px))]">
                  {games.map((entry, index) => (
                    <article key={entry.gameId} className={cardClass}>
                      <div
                        className={thumbClass}
                        style={{ background: THUMB_GRADIENTS[index % THUMB_GRADIENTS.length] }}
                      >
                        <LuGamepad2 size={40} className="text-white/90" />
                        {entry.requiresUpgrade ? (
                          <span className="absolute right-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-black/30 px-2.5 py-1 text-[11px] font-medium text-amber-200 backdrop-blur-sm">
                            <LuCrown className="text-[12px]" />
                            {t("premium")}
                          </span>
                        ) : null}
                      </div>

                      <div className={bodyClass}>
                        <div>
                          <h2 className="truncate text-lg font-semibold tracking-tight text-dashText">
                            {entry.title}
                          </h2>
                          <p className="mt-0.5 text-[12px] text-dashTextMute">{entry.tagline}</p>
                        </div>

                        <p className="min-h-[40px] text-sm leading-6 text-dashTextDim">
                          {entry.description}
                        </p>

                        <div className="flex flex-wrap items-center gap-2">
                          <span className={badgeClass}>
                            <LuUsers className="text-[12px]" />
                            {entry.players.min === entry.players.max
                              ? t("playersExact", { min: entry.players.min })
                              : t("players", {
                                  min: entry.players.min,
                                  max: entry.players.max,
                                })}
                          </span>
                          <span className={badgeClass}>
                            {t(`categories.${entry.category}`)}
                          </span>
                        </div>

                        <div className="mt-1">
                          <button
                            type="button"
                            className={ctaClass}
                            disabled={opening !== null}
                            onClick={() => handlePlay(entry)}
                          >
                            {opening === entry.gameId ? (
                              <>
                                <ImSpinner2 className="animate-spin" />
                                {t("starting")}
                              </>
                            ) : entry.requiresUpgrade ? (
                              t("premiumHint")
                            ) : (
                              t("start")
                            )}
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
          </div>
      </div>
  );
}
