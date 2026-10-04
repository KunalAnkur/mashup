/**
 * Games registered in arcade that costume should not list yet.
 *
 * This is the one place costume names a game, and it only ever subtracts. The proper
 * home for "not listed" is the game's manifest in arcade; once the catalog can express
 * that, this file goes. Hidden games still work by direct link (e.g. `/games/nes`).
 */
const HIDDEN_GAME_IDS: ReadonlySet<string> = new Set(["nes"]);

export function isListedGame(gameId: string): boolean {
  return !HIDDEN_GAME_IDS.has(gameId);
}
