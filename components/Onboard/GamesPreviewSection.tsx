"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { getCatalog, type CatalogEntry } from "@movmash/arcade-client";
import { LuGamepad2 } from "react-icons/lu";
import { RootState } from "@/lib/store";
import { useI18n, useTranslations } from "@/i18n/I18nProvider";
import { useOpenActivityRoom } from "@/components/Activity/useOpenActivityRoom";
import { trackCTAClicked } from "@/lib/analytics";
import {
  dashGameCardClass,
  dashGameCardMetaClass,
  dashGameCardNameClass,
  dashGameCardSubClass,
  dashGameCardThumbClass,
  dashGamesGridClass,
  dashSectionHeadClass,
  dashSectionHeadLinkClass,
  dashSectionHeadTitleClass,
} from "../UI/classTokens";

// Cycles across game cards missing bespoke art — same idea as CARD_ART_STYLES in
// components/Product/type.ts for products without custom art.
const THUMB_GRADIENTS = [
  "linear-gradient(135deg,#e11d48,#7c1d3a)",
  "linear-gradient(135deg,#db2777,#5c1236)",
  "linear-gradient(135deg,#c026d3,#5a1264)",
  "linear-gradient(135deg,#e11d48,#c026d3)",
];

const GamesPreviewSection = () => {
  const router = useRouter();
  const { locale } = useI18n();
  const t = useTranslations("home");
  const tGames = useTranslations("games");
  const subscription = useSelector((state: RootState) => state.subscription);
  const openActivityRoom = useOpenActivityRoom();
  const [opening, setOpening] = useState<string | null>(null);

  const tier = subscription?.subscription?.plan?.name?.toLowerCase().includes("free")
    ? "free"
    : subscription?.subscription
      ? "premium"
      : "free";

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

  if (games.length === 0) return null;

  return (
    <section>
      <div className={dashSectionHeadClass}>
        <h2 className={dashSectionHeadTitleClass}>{t("popularGames")}</h2>
        <button type="button" onClick={() => router.push("/games")} className={dashSectionHeadLinkClass}>
          {t("viewAll")}
        </button>
      </div>

      <div className={dashGamesGridClass}>
        {games.map((entry, index) => (
          <button
            key={entry.gameId}
            type="button"
            disabled={opening !== null}
            onClick={() => handlePlay(entry)}
            className={`${dashGameCardClass} text-left transition-opacity duration-150 disabled:cursor-not-allowed disabled:opacity-60`}
          >
            <div
              className={dashGameCardThumbClass}
              style={{ background: THUMB_GRADIENTS[index % THUMB_GRADIENTS.length] }}
            >
              <LuGamepad2 size={30} />
            </div>
            <div className={dashGameCardMetaClass}>
              <div className={dashGameCardNameClass}>{entry.title}</div>
              <div className={dashGameCardSubClass}>
                {entry.players.min === entry.players.max
                  ? tGames("playersExact", { min: entry.players.min })
                  : tGames("players", { min: entry.players.min, max: entry.players.max })}
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
};

export default GamesPreviewSection;
