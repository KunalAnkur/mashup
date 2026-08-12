"use client";

import { useRouter } from "next/navigation";

import { useTranslations } from "@/i18n/I18nProvider";
import { GameCard } from "@/components/Games/GameCard";
import { useGameGallery } from "@/components/Games/useGameGallery";
import {
  dashGamesGridClass,
  dashSectionHeadClass,
  dashSectionHeadLinkClass,
  dashSectionHeadTitleClass,
} from "../UI/classTokens";

const GamesPreviewSection = () => {
  const router = useRouter();
  const t = useTranslations("home");
  const { games, opening, play } = useGameGallery();

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
        {games.map((entry) => (
          <GameCard
            key={entry.gameId}
            entry={entry}
            opening={opening === entry.gameId}
            disabled={opening !== null}
            onPlay={play}
          />
        ))}
      </div>
    </section>
  );
};

export default GamesPreviewSection;
