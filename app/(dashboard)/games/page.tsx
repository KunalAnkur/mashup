"use client";

import { useTranslations } from "@/i18n/I18nProvider";
import { GameCard } from "@/components/Games/GameCard";
import { useGameGallery } from "@/components/Games/useGameGallery";
import {
  appSectionTitleTextClass,
  dashGamesCatalogGridClass,
  dashPageTitleWrapClass,
  dashPageContentWrapClass,
} from "@/components/UI/classTokens";

export default function GamesPage() {
  const t = useTranslations("games");
  const { games, opening, play } = useGameGallery();

  return (
    <div className={dashPageContentWrapClass}>
      <div className={dashPageTitleWrapClass}>
        <h1 className={appSectionTitleTextClass}>{t("title")}</h1>
      </div>
      <p className="mb-6 max-w-md text-sm leading-6 text-white/50">{t("subtitle")}</p>

      {games.length === 0 ? (
        <p className="py-16 text-center text-sm text-white/40">{t("empty")}</p>
      ) : (
        <div className={dashGamesCatalogGridClass}>
          {games.map((entry) => (
            <GameCard
              key={entry.gameId}
              entry={entry}
              detailed
              opening={opening === entry.gameId}
              disabled={opening !== null}
              onPlay={play}
            />
          ))}
        </div>
      )}
    </div>
  );
}
