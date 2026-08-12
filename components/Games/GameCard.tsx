"use client";

import { useState } from "react";
import type { CatalogEntry } from "@movmash/arcade-client";
import { LuCrown, LuGamepad2, LuUsers } from "react-icons/lu";
import { ImSpinner2 } from "react-icons/im";

import { useTranslations } from "@/i18n/I18nProvider";
import {
  dashGameCardBadgeClass,
  dashGameCardBadgeRowClass,
  dashGameCardClass,
  dashGameCardCoverClass,
  dashGameCardCoverCompactClass,
  dashGameCardCoverDetailedClass,
  dashGameCardCoverImgClass,
  dashGameCardCtaClass,
  dashGameCardDescClass,
  dashGameCardMetaClass,
  dashGameCardNameClass,
  dashGameCardPremiumBadgeClass,
  dashGameCardSubClass,
} from "@/components/UI/classTokens";
import { coverOf } from "./cover";

interface GameCardProps {
  entry: CatalogEntry;
  /** True for the /games catalogue: adds the description, badges and a visible CTA. */
  detailed?: boolean;
  /** This card is the one opening a room. */
  opening?: boolean;
  /** Some card is opening — every card in the grid waits for it. */
  disabled?: boolean;
  onPlay: (entry: CatalogEntry) => void;
}

/**
 * One game, everywhere a game is offered.
 *
 * Everything drawn here comes from the catalogue entry, which comes from the game's own
 * manifest in arcade — the cover art, the accent colour it falls back to, the title, the
 * player count. Nothing in this file knows what any particular game is, and adding one
 * must never require touching it.
 */
export const GameCard = ({
  entry,
  detailed = false,
  opening = false,
  disabled = false,
  onPlay,
}: GameCardProps) => {
  const t = useTranslations("games");
  const [artFailed, setArtFailed] = useState(false);

  const cover = coverOf(entry.presentation);
  const accent = entry.presentation?.accent;
  const glyph = entry.presentation?.glyph;

  const players =
    entry.players.min === entry.players.max
      ? t("playersExact", { min: entry.players.min })
      : t("players", { min: entry.players.min, max: entry.players.max });

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onPlay(entry)}
      className={dashGameCardClass}
    >
      <div
        className={`${dashGameCardCoverClass} ${
          detailed ? dashGameCardCoverDetailedClass : dashGameCardCoverCompactClass
        }`}
        // Tint the box behind the art in the game's own colour, so a cover that is
        // still loading — or one that never arrives — is never a grey hole.
        style={accent ? { backgroundColor: `${accent}1f` } : undefined}
      >
        {cover && !artFailed ? (
          // A plain <img>, deliberately, against the lint rule's advice: arcade already
          // publishes exactly the three widths below as WebP, so next/image would re-
          // encode files that are already optimal, bill a transformation per variant,
          // and need asset.movmash.com added to remotePatterns to do it.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover.src}
            {...(cover.srcSet ? { srcSet: cover.srcSet } : {})}
            // Without this the browser assumes the image spans the viewport and takes
            // the 1200px file every time — on the dashboard strip that is 81kB where
            // 15kB is the right answer.
            //
            // The catalogue's grid tracks are capped at 320px at every width, so one
            // number covers it. The strip is two-up below 901px and four-up above,
            // which is where its own breakpoint comes from — keep the two in step.
            sizes={detailed ? "320px" : "(max-width: 900px) 50vw, 200px"}
            alt=""
            width={cover.width}
            height={cover.height}
            loading="lazy"
            decoding="async"
            className={dashGameCardCoverImgClass}
            onError={() => setArtFailed(true)}
          />
        ) : glyph && accent ? (
          // The manifest's own fallback: path data stroked in the game's accent. It is
          // deliberately not an icon name — costume keeps no map of games to artwork.
          <svg
            viewBox="0 0 24 24"
            width={detailed ? 40 : 30}
            height={detailed ? 40 : 30}
            fill="none"
            stroke={accent}
            strokeWidth={1.6}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d={glyph} />
          </svg>
        ) : (
          // A game that declares no art at all. Render it plainly rather than inventing
          // a colour for it.
          <LuGamepad2 size={detailed ? 40 : 30} className="text-dashTextMute" />
        )}

        {entry.requiresUpgrade ? (
          <span className={dashGameCardPremiumBadgeClass}>
            <LuCrown className="text-[11px]" />
            {t("premium")}
          </span>
        ) : null}
      </div>

      <div className={dashGameCardMetaClass}>
        <div className={dashGameCardNameClass}>{entry.title}</div>
        <div className={dashGameCardSubClass}>{detailed ? entry.tagline : players}</div>

        {detailed ? (
          <>
            <p className={dashGameCardDescClass}>{entry.description}</p>

            <div className={dashGameCardBadgeRowClass}>
              <span className={dashGameCardBadgeClass}>
                <LuUsers className="text-[11px]" />
                {players}
              </span>
              <span className={dashGameCardBadgeClass}>{t(`categories.${entry.category}`)}</span>
            </div>

            <span className={dashGameCardCtaClass}>
              {opening ? (
                <>
                  <ImSpinner2 className="animate-spin" />
                  {t("starting")}
                </>
              ) : entry.requiresUpgrade ? (
                t("premiumHint")
              ) : (
                t("start")
              )}
            </span>
          </>
        ) : null}
      </div>
    </button>
  );
};

export default GameCard;
