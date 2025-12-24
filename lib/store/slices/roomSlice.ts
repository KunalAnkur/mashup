import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Playlist, RoomSetting, RoomState, UrlMetadata } from "@/types/storeTypes";
import { RoomCreateResponse } from "@/types/responseTypes";

const initialState: RoomState = {
  haveRoom: false,
  roomId: null,
  playlist: [],
  host: false,
  refer: false,
  settings: {
    panelCollapsed: false
  },
  loading: false,
  focused: false,
};

const roomSlice = createSlice({
  name: "room",
  initialState,
  reducers: {
    setRoom: (state, action: PayloadAction<RoomCreateResponse>) => {
      const data = action.payload.data;
      state.haveRoom = true;
      state.loading = false;
      state.roomId = data.room_id;
      state.playlist = data.playlist || [];
      state.host = action.payload.authId === action.payload.data.user_id;
      // Backend now uses type and source directly
      state.refer = false;
      // state.selectedIndex = data.playlist.findIndex((item) => item.selected) || 0;
    },
    exitRoom: (state) => {
      state.haveRoom = false;
      state.loading = false;
      state.roomId = null;
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
    setPanelCollapsed: (state, action: PayloadAction<Partial<RoomSetting>>) => {
      state.settings = {
        ...state.settings,
        ...action.payload,
      };
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
  },
  extraReducers: (builder) => {},
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
} = roomSlice.actions;
export default roomSlice;
