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
        const playlistWithScreen = [
          ...content,
          ...playlist
            .filter((item) => item.source !== "screen")
            .map((item) => ({ ...item, selected: false })),
        ];
        const playlistItems = [
          ...content,
          ...playlist.map((item) => ({ ...item, selected: false })),
        ];

        syncPlaylist(playlistWithScreen, playlistItems);
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

      const playlistWithScreen = playlist
        .filter((item) => item.source !== "screen")
        .map((item, index) => ({
          ...item,
          selected: index === 0,
        }));

      const playlistItems = playlist.map((item, index) => ({
        ...item,
        selected: index === 0,
      }));

      syncPlaylist(playlistWithScreen, playlistItems);
    },
    [isHost, roomId, playlist, syncPlaylist]
  );

  return {
    addPlaylistContent,
    handleScreenShareStopped,
  };
};
