import { NesSetupPage } from "@/components/Games/NesSetupPage";

/**
 * The NES equivalent of `/stream` and `/sync`: pick what you want, get a room.
 *
 * Every other content type on the platform is chosen *before* the room exists, and the
 * room opens already playing it. Games were the exception — they opened an empty room
 * and asked inside it — which for a game that needs a file of your own meant your
 * friend watched you rummage through a file picker.
 *
 * Nested under `/games` rather than promoted to the sidebar: it belongs to a game, not
 * to a whole content type, and the catalogue is where people already look for games.
 * Other games can get a page of their own here the same way.
 */
export default function Page() {
  return <NesSetupPage />;
}
