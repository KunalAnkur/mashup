"use client";

/**
 * The preferences capability, backed by `localStorage` first and guardian second.
 *
 * The order matters more than it looks. Key bindings have to work on the first frame —
 * before the profile request resolves, and at all while offline — so the local copy is
 * what the game reads and the server copy is a synchronisation, not a source. A
 * settings panel that is blank for a second, or a game you cannot control on a bad
 * connection, would both be worse than a stale binding.
 *
 * ## Which copy wins
 *
 * The server's, once, on load. That is what makes the feature mean anything: signing in
 * on another machine has to bring your bindings with you, and if the local copy won
 * there would be nothing to bring. After that first merge the local copy leads and
 * every change is pushed up.
 *
 * The cost is a genuine edge: change a binding offline on machine A, then open machine
 * B, and B's older copy is what syncs. Last-writer-wins on a per-player settings blob,
 * which is the right trade against making a game wait for the network to be playable.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import type { Preferences, PreferencesPort } from "@movmash/arcade-client";

import { RootState } from "@/lib/store";
import {
  useGetActivityPreferencesQuery,
  useResetActivityPreferencesMutation,
  useSaveActivityPreferencesMutation,
} from "@/lib/store/api/activityPreferencesApi";

/** Per game, and per user — two accounts on one browser must not share bindings. */
function storageKey(gameId: string, userId: string): string {
  return `movmash:activity-prefs:${gameId}:${userId || "anon"}`;
}

function readLocal(key: string): Preferences {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : null;
    // A blob written by an older version may be anything at all. Only a plain object
    // is usable; everything else degrades to "no settings", which the game reads as
    // its own defaults.
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    // Private windows, blocked site data, corrupt JSON. None is worth an error.
    return {};
  }
}

function writeLocal(key: string, value: Preferences): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota, or storage disabled — the in-memory copy still works for this session */
  }
}

/** How long a burst of changes is collected before one request goes up. */
const SYNC_DEBOUNCE_MS = 800;

export function useActivityPreferences(gameId: string | null): PreferencesPort | undefined {
  const authUser = useSelector((state: RootState) => state.auth.user);
  const userId = authUser?.id ?? "";
  const signedIn = Boolean(userId);

  const key = gameId ? storageKey(gameId, userId) : null;

  // Seeded synchronously from storage, so the very first render already has the real
  // bindings rather than defaults that flicker a moment later.
  const [value, setValue] = useState<Preferences>(() => (key ? readLocal(key) : {}));
  const [merged, setMerged] = useState(false);

  const { data, isSuccess, isError } = useGetActivityPreferencesQuery(gameId as string, {
    skip: !gameId || !signedIn,
  });
  const [saveRemote] = useSaveActivityPreferencesMutation();
  const [resetRemote] = useResetActivityPreferencesMutation();

  // A different game or a different user is a different document entirely.
  useEffect(() => {
    setValue(key ? readLocal(key) : {});
    setMerged(false);
  }, [key]);

  /**
   * Take the server's copy, once.
   *
   * Once, not continuously: RTK Query refetches on remount and focus, and adopting
   * every one of those would overwrite edits made since — a player changing a binding
   * and then switching tabs would watch it revert.
   */
  useEffect(() => {
    if (merged || !key) return;
    if (!signedIn) {
      // Nothing to wait for. Local is all there is, and it is already loaded.
      setMerged(true);
      return;
    }
    if (!isSuccess && !isError) return;

    if (isSuccess && data?.prefs && Object.keys(data.prefs).length > 0) {
      setValue(data.prefs);
      writeLocal(key, data.prefs);
    }
    // An error still counts as resolved: the local copy stands, and the game is told
    // its settings are loaded because there is nothing further coming.
    setMerged(true);
  }, [merged, key, signedIn, isSuccess, isError, data]);

  // Held so the debounced push sees the latest write rather than the one that armed it.
  const pendingRef = useRef<Preferences | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = useCallback(() => {
    const pending = pendingRef.current;
    pendingRef.current = null;
    if (!pending || !gameId || !signedIn) return;
    // Fire and forget. A failed sync is not something a game can act on, and the local
    // copy — the one being played against — is already correct.
    void saveRemote({ gameId, prefs: pending });
  }, [gameId, signedIn, saveRemote]);

  const save = useCallback(
    (next: Preferences) => {
      if (!key) return;
      setValue(next);
      writeLocal(key, next);

      // Debounced, because a rebinding screen produces a change per keypress and a
      // volume slider produces one per pixel.
      pendingRef.current = next;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(flush, SYNC_DEBOUNCE_MS);
    },
    [key, flush],
  );

  const reset = useCallback(() => {
    if (!key) return;
    setValue({});
    writeLocal(key, {});
    pendingRef.current = null;
    if (timerRef.current) clearTimeout(timerRef.current);
    if (gameId && signedIn) void resetRemote(gameId);
  }, [key, gameId, signedIn, resetRemote]);

  // A pending change must not be lost to a tab close — this is the one moment where
  // the debounce would otherwise cost somebody their settings.
  useEffect(() => {
    const onHide = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      flush();
    };
    window.addEventListener("pagehide", onHide);
    return () => {
      window.removeEventListener("pagehide", onHide);
      onHide();
    };
  }, [flush]);

  return useMemo(
    () => (gameId ? { value, loaded: merged, save, reset } : undefined),
    [gameId, value, merged, save, reset],
  );
}
