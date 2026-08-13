"use client";

import { useState } from "react";
import type { CatalogEntry } from "@movmash/arcade-client";
import { LuCrown, LuGamepad2, LuUsers } from "react-icons/lu";
import { ImSpinner2 } from "react-icons/im";

import { useTranslations } from "@/i18n/I18nProvider";
import {
  dashGameCardBadgeClass,
  dashGameCardClass,
  dashGameCardCoverClass,
  dashGameCardCoverImgClass,
  dashGameCardCoverRatioClass,
  dashGameCardCtaClass,
  dashGameCardDescClass,
  dashGameCardMetaClass,
  dashGameCardNameClass,
  dashGameCardOverlayBadgeGroupClass,
  dashGameCardOverlayRowClass,
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

  // The overlay badge carries the count alone — two worded pills side by side over the
  // art read as one crowded lump, and the icon beside the number already says what the
  // number is. Built from the counts rather than a translation: a digit and an en dash
  // say the same thing in every locale, and the full phrase stays on the title.
  const playersShort =
    entry.players.min === entry.players.max
      ? `${entry.players.min}`
      : `${entry.players.min}–${entry.players.max}`;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onPlay(entry)}
      className={dashGameCardClass}
    >
      <div
        className={`${dashGameCardCoverClass} ${dashGameCardCoverRatioClass}`}
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
            // The catalogue's grid tracks are capped at 300px at the widest step, so one
            // number covers it. The strip is two-up below 901px and four-up above,
            // which is where its own breakpoint comes from — keep the two in step.
            sizes={detailed ? "300px" : "(max-width: 900px) 50vw, 200px"}
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
            width={32}
            height={32}
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
          <LuGamepad2 size={32} className="text-dashTextMute" />
        )}

        {detailed || entry.requiresUpgrade ? (
          <div className={dashGameCardOverlayRowClass}>
            {/* Catalogue only: the strip's cards already carry the player count as their
                subtitle, and a second copy over 200px of art would just be clutter. The
                group still renders empty on the strip so justify-between keeps the
                premium pill at the far end. */}
            <div className={dashGameCardOverlayBadgeGroupClass}>
              {detailed ? (
                <>
                  <span className={dashGameCardBadgeClass} title={players}>
                    <LuUsers className="text-[11px]" />
                    {playersShort}
                  </span>
                  {/* Phone cards are half a desktop card's width, so the second pill
                      wraps to its own line and the pair ends up covering a third of the
                      art. The count is the fact that changes between games — the
                      category can wait for a viewport with room for it beside it. */}
                  <span className={`${dashGameCardBadgeClass} hidden min-[560px]:inline-flex`}>
                    {t(`categories.${entry.category}`)}
                  </span>
                </>
              ) : null}
            </div>

            {entry.requiresUpgrade ? (
              <span className={dashGameCardPremiumBadgeClass}>
                <LuCrown className="text-[9px]" />
                {t("premium")}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className={dashGameCardMetaClass}>
        <div className={dashGameCardNameClass}>{entry.title}</div>

        {/* The tagline used to sit here on the catalogue too, but it is the same two
            facts the cover badges now carry ("Two players · Quick rounds") — so the
            catalogue goes straight to the description that actually says something. */}
        {detailed ? null : <div className={dashGameCardSubClass}>{players}</div>}

        {detailed ? (
          <>
            <p className={dashGameCardDescClass}>{entry.description}</p>

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
