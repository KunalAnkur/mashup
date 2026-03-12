import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Playlist, RoomSetting, RoomState } from "@/types/storeTypes";
import { RoomCreateResponse } from "@/types/responseTypes";

const initialState: RoomState = {
  haveRoom: false,
  roomId: null,
  playlist: [],
  host: false,
  refer: false,
  watchTime: 0,
  settings: {
    panelCollapsed: false
  },
  loading: false,
  focused: false,
  hostPlayback: {
    playing: false,
  },
};

const roomSlice = createSlice({
  name: "room",
  initialState,
  reducers: {
    setRoom: (state, action: PayloadAction<RoomCreateResponse>) => {
      const data = action.payload.data;
      state.haveRoom = true;
      state.roomId = data.room_id;
      state.playlist = data.playlist.map((item, index) => {
        if (index === 0) {
          return { ...item, selected: true };
        }
        return { ...item, selected: false };
      }) || [];
      state.host = action.payload.authId === action.payload.data.user_id;
      // Backend now uses type and source directly
      state.refer = false;
      state.watchTime = 0;
      state.hostPlayback.playing = false;
      state.loading = false;
      // state.selectedIndex = data.playlist.findIndex((item) => item.selected) || 0;
    },
    exitRoom: (state) => {
      state.haveRoom = false;
      state.loading = false;
      state.roomId = null;
      state.hostPlayback.playing = false;
      // state.event = action.payload;
    },
    setPlaylist: (state, action: PayloadAction<Playlist[]>) => {
      state.playlist = action.payload;
      // state.selectedIndex = action.payload.findIndex((item) => item.selected) || 0;
    },
    setScreenSharing: (state, action: PayloadAction<Playlist>) => {
      // Remove any existing screen sharing items to avoid duplicates
      const otherItems = state.playlist
        .filter(item => item.source !== "screen")
        .map(item => ({ ...item, selected: false }));
      
      // Add the new screen sharing item at the top and mark as selected
      state.playlist = [action.payload, ...otherItems];
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    updateRoomInfo: (
      state,
      action: PayloadAction<{
        playlist?: Playlist[];
      }>
    ) => {
      if (action.payload.playlist !== undefined) {
        state.playlist = action.payload.playlist;
        // state.selectedIndex = action.payload.playlist.findIndex((item) => item.selected) || 0;
      }
    },
    cleanScreenSourcePlaylist: (state) => {
      state.playlist = state.playlist.filter(item => item.source !== "screen");
      // state.selectedIndex = state.playlist.findIndex((item) => item.selected) || 0;
    },
    setPanelCollapsed: (state, action: PayloadAction<Partial<RoomSetting>>) => {
      state.settings = {
        ...state.settings,
        ...action.payload,
      };
    },

    updateWatchTime: (state) => {
      state.watchTime++;
    },
    setRefers: (
      state,
      action: PayloadAction<{
        refer: boolean;
      }>
    ) => {
      state.refer = action.payload.refer;
    },
    setFocused: (state, action: PayloadAction<boolean>) => {
      state.focused = action.payload;
    },
    setHostPlaybackPlaying: (state, action: PayloadAction<boolean>) => {
      state.hostPlayback.playing = action.payload;
    },
  },
  extraReducers: () => {},
});

export const {
  setRoom,
  exitRoom,
  setLoading,
  setPanelCollapsed,
  setRefers,
  updateRoomInfo,
  setFocused,
  setPlaylist,
  setScreenSharing,
  updateWatchTime,
  cleanScreenSourcePlaylist,
  setHostPlaybackPlaying,
} = roomSlice.actions;
export default roomSlice;
