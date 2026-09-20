"use client";

import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import { useUpdateRoomByRoomIdMutation } from "@/lib/store/api/roomApi";
import { updateRoomInfo } from "@/lib/store/slices/roomSlice";
import { useRoomContext } from "@/context/RoomContext";
import { useMediaStreamContext } from "@/context/MediaStreamContext";
import { Playlist } from "@/types/storeTypes";

type ContentSource = "file" | "url" | "screen" | "game";

export const usePlaylistActions = () => {
  const dispatch = useDispatch();
  const roomState = useSelector((state: RootState) => state.room);
  const { broadcastPlaylist } = useRoomContext();
  const { handleStopScreenSharing } = useMediaStreamContext();
  const [updateRoomByRoomId] = useUpdateRoomByRoomIdMutation();

  const isHost = roomState.host;
  const roomId = roomState.roomId;
  const playlist = roomState.playlist;

  const syncPlaylist = useCallback(
    (playlistForStore: Playlist[], playlistForBroadcast: Playlist[] = playlistForStore) => {
      if (!isHost || !roomId) return;

      // * Single sync path:
      // * 1) host redux state, 2) persisted playlist, 3) socket broadcast to guests.
      dispatch(updateRoomInfo({ playlist: playlistForStore }));
      void updateRoomByRoomId({ roomId, body: { playlist: playlistForBroadcast } }).unwrap();
      broadcastPlaylist(playlistForBroadcast);
    },
    [broadcastPlaylist, dispatch, isHost, roomId, updateRoomByRoomId]
  );

  const addPlaylistContent = useCallback(
    (content: Playlist[], source: ContentSource) => {
      if (!isHost || !roomId) return;

      if (source === "screen") {
        // * Keep only one screen entry at the top and clear selected flags on remaining items.
        const playlistWithScreen = [
          ...content,
          ...playlist
            .filter((item) => item.source !== "screen")
            .map((item) => ({ ...item, selected: false })),
        ];
        syncPlaylist(playlistWithScreen, playlistWithScreen);
        return;
      }

      if (source === "game") {
        // One activity at a time, and it is always the selected one: the room decides it
        // is an activity room from the mere presence of an entry of this type, and
        // ActivityRoomSurface reads the game id off the selected one. Two would make
        // which game you get depend on array order.
        //
        // Everything queued is kept, just deselected. A game is a detour, not a reset —
        // removeActivity below puts the room back exactly where it was.
        const playlistWithActivity = [
          ...content,
          ...playlist
            .filter((item) => item.type !== "activity")
            .map((item) => ({ ...item, selected: false })),
        ];
        syncPlaylist(playlistWithActivity);
        return;
      }

      const playlistItems = playlist.length
        ? [...playlist, ...content]
        : [...playlist, ...content].map((item, index) => ({
            ...item,
            selected: index === 0,
          }));

      syncPlaylist(playlistItems);
    },
    [isHost, roomId, playlist, syncPlaylist]
  );

  /**
   * Leaves the game and gives the room back to whatever was queued.
   *
   * Dropping the activity entries is the whole mechanism — isActivityRoom is derived from
   * their presence, so removing them is what returns the video surface. The first
   * remaining item is re-selected because deselecting them all is how they got here, and
   * a playlist with nothing selected shows the empty state instead of the queue.
   */
  const removeActivity = useCallback(() => {
    if (!isHost || !roomId) return;

    const remaining = playlist.filter((item) => item.type !== "activity");
    const restored = remaining.some((item) => item.selected)
      ? remaining
      : remaining.map((item, index) => ({ ...item, selected: index === 0 }));

    syncPlaylist(restored);
  }, [isHost, roomId, playlist, syncPlaylist]);

  const handleScreenShareStopped = useCallback(
    (streamId: string) => {
      void streamId;
      if (!isHost || !roomId) return;

      // * Preserve currently selected non-screen item when screen entries are removed.
      const selectedNonScreenId =
        playlist.find((item) => item.selected && item.source !== "screen")?.id ||
        playlist.find((item) => item.source !== "screen")?.id ||
        null;

      // * Drop all screen items from shared playlist state.
      const playlistWithoutScreen = playlist
        .filter((item) => item.source !== "screen")
        .map((item) => ({
          ...item,
          selected: selectedNonScreenId ? item.id === selectedNonScreenId : false,
        }));

      // ! Always keep exactly one selected item when any non-screen item exists.
      if (playlistWithoutScreen.length && !playlistWithoutScreen.some((item) => item.selected)) {
        playlistWithoutScreen[0] = { ...playlistWithoutScreen[0], selected: true };
      }

      // * Apply the same payload locally and to guests to keep selection/index consistent.
      syncPlaylist(playlistWithoutScreen, playlistWithoutScreen);

      // Hold the invariant "no screen items in the playlist means no live capture" here rather
      // than trusting every caller to release it first — that assumption is exactly what leaked.
      // Redundant for the two existing callers (the card's X releases it first, the browser's own
      // Stop sharing has already ended the tracks) and harmless: stopping an ended track is a
      // no-op, and stop() does not re-fire 'ended', so this cannot loop back through here.
      handleStopScreenSharing();
    },
    [isHost, roomId, playlist, syncPlaylist, handleStopScreenSharing]
  );

  return {
    addPlaylistContent,
    handleScreenShareStopped,
    removeActivity,
  };
};
