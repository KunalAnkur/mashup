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
      {/* Title centered like every other sidebar route, but the grid stays flush left:
          a catalogue is a list that grows, and centering it would move the first card
          sideways every time a game is added. */}
      <div className={`${dashPageTitleWrapClass} justify-center`}>
        <h1 className={appSectionTitleTextClass}>{t("title")}</h1>
      </div>

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
