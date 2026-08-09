"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { getCatalog, type CatalogEntry } from "@movmash/arcade-client";
import { LuUsers, LuCrown } from "react-icons/lu";
import { ImSpinner2 } from "react-icons/im";

import { RootState } from "@/lib/store";
import { useI18n, useTranslations } from "@/i18n/I18nProvider";
import { useOpenActivityRoom } from "@/components/Activity/useOpenActivityRoom";
import { trackCTAClicked } from "@/lib/analytics";
import {
  appHomeEntryCardSurfaceClass,
  appSectionTitleTextClass,
  dashPageTitleWrapClass,
  dashPageContentWrapClass,
  movmashProminentCtaClass,
} from "@/components/UI/classTokens";

const cardClass =
  `group relative flex flex-col gap-3 overflow-hidden rounded-2xl p-5 text-start ${appHomeEntryCardSurfaceClass} transition-all duration-300`;
const badgeClass =
  "inline-flex items-center gap-1 rounded-full bg-white/[0.06] px-2.5 py-1 text-[11px] font-medium text-white/60";
const ctaClass =
  `inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white transition-all duration-200 ${movmashProminentCtaClass} disabled:cursor-not-allowed disabled:opacity-50`;

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
          <div className={dashPageTitleWrapClass}>
            <h1 className={appSectionTitleTextClass}>{t("title")}</h1>
          </div>
          <p className="mb-6 max-w-md text-sm leading-6 text-white/50">
            {t("subtitle")}
          </p>

              {games.length === 0 ? (
                <p className="py-16 text-center text-sm text-white/40">{t("empty")}</p>
              ) : (
                // auto-fit with a capped track centres a single card and grids a full
                // catalogue evenly, without having to count items
                <div className="grid justify-start gap-3 [grid-template-columns:repeat(auto-fit,minmax(260px,340px))]">
                  {games.map((entry) => (
                    <article key={entry.gameId} className={cardClass}>
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(52,211,153,0.10),transparent_45%)] opacity-90" />

                      <div className="relative flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h2 className="truncate text-lg font-semibold tracking-tight text-white">
                            {entry.title}
                          </h2>
                          <p className="mt-0.5 text-[12px] text-white/40">{entry.tagline}</p>
                        </div>
                        {entry.requiresUpgrade ? (
                          <span className={`${badgeClass} text-amber-200`}>
                            <LuCrown className="text-[12px]" />
                            {t("premium")}
                          </span>
                        ) : null}
                      </div>

                      <p className="relative min-h-[40px] text-sm leading-6 text-white/60">
                        {entry.description}
                      </p>

                      <div className="relative flex flex-wrap items-center gap-2">
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

                      <div className="relative mt-1">
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
                    </article>
                  ))}
                </div>
              )}
      </div>
  );
}
