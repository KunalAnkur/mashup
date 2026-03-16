"use client";

import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import { useUpdateRoomByRoomIdMutation } from "@/lib/store/api/roomApi";
import { updateRoomInfo } from "@/lib/store/slices/roomSlice";
import { useRoomContext } from "@/context/RoomContext";
import { Playlist } from "@/types/storeTypes";

type ContentSource = "file" | "url" | "screen";

export const usePlaylistActions = () => {
  const dispatch = useDispatch();
  const roomState = useSelector((state: RootState) => state.room);
  const { broadcastPlaylist } = useRoomContext();
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
    },
    [isHost, roomId, playlist, syncPlaylist]
  );

  return {
    addPlaylistContent,
    handleScreenShareStopped,
  };
};
