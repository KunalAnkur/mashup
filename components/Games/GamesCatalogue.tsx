"use client";

import { useTranslations } from "@/i18n/I18nProvider";
import { GameCard } from "@/components/Games/GameCard";
import { useGameGallery } from "@/components/Games/useGameGallery";
import {
  appSectionTitleTextClass,
  dashGamesCatalogGridClass,
  dashPageTitleWrapClass,
} from "@/components/UI/classTokens";

/**
 * The page title and the catalogue grid, lifted out of `/games/page.tsx` so that page
 * can be a server component and fetch its guides.
 *
 * Nothing here changed in the move: the games, the viewer's tier and the press handler
 * still come from `useGameGallery`, which the home strip also uses, so the two surfaces
 * cannot disagree about which games exist or what starting one does. The title travelled
 * with the grid rather than staying behind because it needs `useTranslations`, and a
 * separate client component for one heading would be a file that earns nothing.
 */
export function GamesCatalogue() {
  const t = useTranslations("games");
  const { games, opening, play } = useGameGallery();

  return (
    <div>
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
