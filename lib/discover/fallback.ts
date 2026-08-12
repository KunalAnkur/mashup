import type { DiscoverSlide } from "./types";

/**
 * What the carousel shows when the CMS cannot be reached.
 *
 * Deliberately three games and nothing editorial: games are the one category whose art
 * and behaviour live in this repo's dependencies rather than behind a network call, so
 * these keep working when everything else does not. Same idea as arcade's bundled
 * puzzle library — a fallback that names things which might not exist is worse than no
 * fallback at all.
 *
 * They carry no art of their own. The carousel resolves each game's cover from the
 * arcade catalog, so this list stays correct when a game's artwork is replaced.
 */
export const FALLBACK_SLIDES: DiscoverSlide[] = [
  {
    id: "game:jigsaw",
    category: "game",
    title: { en: "Jigsaw" },
    action: { kind: "game", gameId: "jigsaw" },
    media: {},
  },
  {
    id: "game:connect4",
    category: "game",
    title: { en: "Connect 4" },
    action: { kind: "game", gameId: "connect4" },
    media: {},
  },
  {
    id: "game:tictactoe",
    category: "game",
    title: { en: "Tic-Tac-Toe" },
    action: { kind: "game", gameId: "tictactoe" },
    media: {},
  },
];
