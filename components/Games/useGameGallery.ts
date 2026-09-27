"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { getCatalog, type CatalogEntry } from "@movmash/arcade-client";

import { RootState } from "@/lib/store";
import { useI18n } from "@/i18n/I18nProvider";
import { useOpenActivityRoom } from "@/components/Activity/useOpenActivityRoom";
import { trackCTAClicked } from "@/lib/analytics";

/**
 * The catalogue, the viewer's tier, and what happens when a card is pressed.
 *
 * Shared by the dashboard's Popular Games strip and the /games page so the two cannot
 * disagree about which games exist, which are locked, or what starting one does — they
 * held identical copies of all three before this.
 *
 * There is no list of games in here and there must never be one: a new game appears in
 * both places by being registered in arcade, with no change to costume at all.
 */
export function useGameGallery() {
  const router = useRouter();
  const { locale } = useI18n();
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

  const play = useCallback(
    (entry: CatalogEntry) => {
      if (entry.requiresUpgrade) {
        router.push("/pricing");
        return;
      }
      /*
       * Some games need something picked before the room exists — a file of the
       * player's own, say. Opening a room first means whoever you invited watches you
       * rummage through a file dialog, so those games get a page of their own first,
       * exactly like `/stream` and `/sync` do for the other content types.
       *
       * Read off the manifest rather than matched on an id, because there is no list
       * of games in this file and there must never be one. A game declares
       * `needsSetup` and gets its page at `/games/<id>`; a game that does not is
       * opened straight into a room, which is what has always happened.
       */
      if (entry.needsSetup) {
        trackCTAClicked("games_setup", { game_id: entry.gameId });
        router.push(`/games/${entry.gameId}`);
        return;
      }

      setOpening(entry.gameId);
      trackCTAClicked("games_start", { game_id: entry.gameId });
      openActivityRoom(entry.gameId);
    },
    [openActivityRoom, router],
  );

  return { games, opening, play };
}
