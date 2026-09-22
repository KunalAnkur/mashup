"use client";

import type { CatalogEntry } from "@movmash/arcade-client";
import { LuGamepad2 } from "react-icons/lu";

import Modal, { ModalHeader } from "@/components/UI/Modal";
import { GameCard } from "@/components/Games/GameCard";
import { useTranslations } from "@/i18n/I18nProvider";
import {
  gamePickerGridClass,
  gamePickerPanelClass,
  gamePickerScrollClass,
} from "@/components/UI/classTokens";

/**
 * Picking a game without leaving the room.
 *
 * The catalogue comes in from the caller rather than being read here, so this shares the
 * exact list, lock states and tier logic that /games and the home strip use — a game
 * registered in arcade appears here too, with no change to this file.
 *
 * Locked games are shown, not hidden, for the same reason the catalogue shows them: a
 * ceiling nobody can see is a ceiling nobody knows they could raise. Pressing one is the
 * upgrade path, and in here that opens the room's own upgrade modal rather than
 * navigating a host out of a live room.
 */
export function GamePickerModal({
  open,
  onClose,
  games,
  opening,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  games: CatalogEntry[];
  /** Game id currently being started, if any — every card waits for it. */
  opening: string | null;
  onPick: (entry: CatalogEntry) => void;
}) {
  const t = useTranslations("games");

  return (
    <Modal open={open} onClose={onClose} panelClassName={gamePickerPanelClass}>
      <ModalHeader
        icon={<LuGamepad2 size={18} />}
        title={t("roomPickerTitle")}
        subtitle={t("roomPickerSubtitle")}
        onClose={onClose}
      />

      <div className={gamePickerScrollClass}>
        {games.length === 0 ? (
          <p className="px-1 py-6 text-center text-sm text-white/55">{t("empty")}</p>
        ) : (
          <div className={gamePickerGridClass}>
            {games.map((entry) => (
              <GameCard
                key={entry.gameId}
                entry={entry}
                opening={opening === entry.gameId}
                disabled={opening !== null && opening !== entry.gameId}
                onPlay={onPick}
              />
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}

export default GamePickerModal;
