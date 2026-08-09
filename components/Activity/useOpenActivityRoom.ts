"use client";

import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";

import { RootState } from "@/lib/store";
import { setPlaylist, setRefers } from "@/lib/store/slices/roomSlice";
import type { Playlist } from "@/types/storeTypes";

/**
 * Opens a room with a game on the main surface.
 *
 * Reuses the room-creation flow `/sync` and `/stream` already use rather than adding a
 * second path: dispatch a playlist, set `refer`, and let `AuthGuard` create the room
 * and navigate. That gets the sign-in redirect, the guest-host prompt, and persistence
 * for free — and means an activity room is a normal room in every respect.
 *
 * The playlist holds one synthetic entry because `createRoomWithRefer` refuses an empty
 * one. Its `link` carries the game id, which is the only place the platform records
 * which game a room was opened for; nothing on the server reads it as anything but an
 * opaque string.
 */
export function useOpenActivityRoom() {
  const dispatch = useDispatch();
  const router = useRouter();
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  return useCallback(
    (gameId: string) => {
      const entry: Playlist = {
        id: crypto.randomUUID(),
        type: "activity",
        source: "game",
        link: gameId,
        selected: true,
        onlyAudio: false,
        metadata: {},
      };

      dispatch(setPlaylist([entry]));
      dispatch(setRefers({ refer: true }));

      if (!isAuthenticated) {
        router.push("/login");
      }
      // Authenticated: AuthGuard creates the room and navigates.
    },
    [dispatch, router, isAuthenticated],
  );
}
