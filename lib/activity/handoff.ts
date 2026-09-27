/**
 * What somebody picked before the room existed.
 *
 * `/games/nes` asks for a cartridge and then creates a room, the same way `/stream`
 * asks for a video and `/sync` asks for a URL. The file is chosen on one page and
 * needed on another, and it cannot go via the server — a locally-loaded cartridge is
 * bytes off somebody's disk, and not uploading them is a deliberate position (see the
 * game's `savestate.ts`). So it is carried here, in the tab, for the few hundred
 * milliseconds between the two screens.
 *
 * ## Memory, with `sessionStorage` underneath it
 *
 * The first version kept this in a module-level value alone, on the reasoning that
 * room creation and the navigation after it happen inside one client-side transition,
 * so the value would live exactly as long as it needed to. That reasoning was too
 * confident. Whether a given navigation is a client-side transition or a full document
 * load is not something this file gets to decide — a redirect, a middleware, an
 * auth bounce or a route group boundary can each turn one into the other — and when it
 * is a full load, every module is evaluated again and the cartridge is simply gone.
 * The symptom is indistinguishable from working: the room opens, and asks for a
 * cartridge you already chose.
 *
 * So the value is mirrored into `sessionStorage`, which survives that. Deliberately
 * **not** `localStorage` or IndexedDB: session storage is per-tab and disappears with
 * the tab, so this stays a handover rather than quietly becoming a library of
 * everybody's ROMs. That is a licensing and privacy decision, not a caching one.
 *
 * Memory is still read first and written always, because it is exact — the round trip
 * through base64 is only there for the reload case, and a browser with storage
 * disabled or full still works through it.
 */

export interface Handoff {
  /** The game's own name for what this is — `"nes-rom"`. Never interpreted here. */
  kind: string;
  /** What to call it on screen. A file name, usually. */
  name: string;
  bytes: Uint8Array;
}

let pending: Handoff | null = null;

const KEY = "movmash:handoff";

/**
 * Survive a full page load, when the browser lets us.
 *
 * Every access is wrapped: `sessionStorage` throws in private windows, can be disabled
 * outright, and rejects a write that would exceed its quota — which a large cartridge
 * genuinely might, since base64 costs a third on top. None of that is worth failing
 * for, because the in-memory copy still covers the ordinary case.
 */
function remember(handoff: Handoff | null): void {
  try {
    if (!handoff) {
      sessionStorage.removeItem(KEY);
      return;
    }
    let binary = "";
    for (const byte of handoff.bytes) binary += String.fromCharCode(byte);
    sessionStorage.setItem(
      KEY,
      JSON.stringify({ kind: handoff.kind, name: handoff.name, data: btoa(binary) }),
    );
  } catch {
    // Memory only, then. See above.
  }
}

function recall(): Handoff | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { kind: string; name: string; data: string };
    const binary = atob(parsed.data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return { kind: parsed.kind, name: parsed.name, bytes };
  } catch {
    return null;
  }
}

/** Leave something for the room that is about to open. Replaces anything waiting. */
export function putHandoff(handoff: Handoff): void {
  pending = handoff;
  remember(handoff);
}

/**
 * Take it, once.
 *
 * Consuming, and matched on `kind`: a payload left behind by one game must not be
 * picked up by another, and a second read is always the wrong one — it would reload a
 * cartridge over whatever is already running.
 */
export function takeHandoff(kind: string): Handoff | null {
  const held = pending ?? recall();
  if (!held || held.kind !== kind) return null;
  pending = null;
  remember(null);
  return held;
}

/** Drop anything waiting. For leaving a page without going on to a room. */
export function clearHandoff(): void {
  pending = null;
  remember(null);
}

/**
 * `__movmashHandoff()` in the browser console: is anything waiting, and what.
 *
 * This whole mechanism rests on one assumption — that a module-level value survives
 * the navigation between the page that sets it and the room that reads it. That is
 * true for a client-side transition and false for a full page load, and from the
 * outside the two are indistinguishable: either way the room opens, and either way the
 * only symptom is a cartridge picker where a game should have been.
 */
if (typeof globalThis !== "undefined") {
  (globalThis as { __movmashHandoff?: () => unknown }).__movmashHandoff = () => {
    const held = pending ?? recall();
    return held
      ? { kind: held.kind, name: held.name, bytes: held.bytes.length, inMemory: pending !== null }
      : null;
  };
}
