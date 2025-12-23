"use client";

import { createContext, useContext, ReactNode, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import { updateRoomInfo } from "@/lib/store/slices/roomSlice";
import { useSocket } from "@/context/SocketContext";
import { SocketEvent } from "@/types/socketEvents";
import type { Playlist } from "@/types/storeTypes";

interface VideoSelectionContextType {
  selectedIndex: number;
  selectVideo: (index: number) => void;
  isHost: boolean;
}

const VideoSelectionContext = createContext<VideoSelectionContextType>({
  selectedIndex: 0,
  selectVideo: () => {},
  isHost: false,
});

interface VideoSelectionProviderProps {
  children: ReactNode;
}

/**
 * VideoSelectionProvider
 *
 * Provides video selection functionality that works with the new
 * playlist-based room state.
 *
 * - Uses `room.playlist` from Redux
 * - Host updates playlist.selected and broadcasts SELECT_VIDEO
 * - Non-hosts typically react via useSync/useVideoSync; this context is
 *   primarily for components that want easy access to the current index
 */
export const VideoSelectionProvider = ({ children }: VideoSelectionProviderProps) => {
  const dispatch = useDispatch();
  const { socket } = useSocket();
  const roomState = useSelector((state: RootState) => state.room);

  const isHost = roomState.host;
  const playlist = roomState.playlist || [];

  const selectedIndex = (() => {
    if (!playlist.length) return 0;
    const idx = playlist.findIndex((item) => item.selected);
    return idx === -1 ? 0 : idx;
  })();

  // Host: select video by playlist index
  const selectVideo = useCallback(
    (index: number) => {
      if (!isHost) return;
      if (!playlist.length) return;
      if (index < 0 || index >= playlist.length) return;

      const updated: Playlist[] = playlist.map((item, idx) => ({
        ...item,
        selected: idx === index,
      }));

      // Update local Redux state
      dispatch(updateRoomInfo({ playlist: updated }));

      // Broadcast selection to other users
      if (socket && roomState.roomId) {
        socket.emit(SocketEvent.SELECT_VIDEO, {
          roomId: roomState.roomId,
          selectedIndex: index,
        });
      }
    },
    [isHost, playlist, dispatch, socket, roomState.roomId]
  );

  return (
    <VideoSelectionContext.Provider value={{ selectedIndex, selectVideo, isHost }}>
      {children}
    </VideoSelectionContext.Provider>
  );
};

export const useVideoSelection = () => useContext(VideoSelectionContext);
