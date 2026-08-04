import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Playlist, RoomSetting, RoomState } from "@/types/storeTypes";
import { RoomCreateResponse } from "@/types/responseTypes";

const initialState: RoomState = {
  haveRoom: false,
  roomId: null,
  playlist: [],
  host: false,
  refer: false,
  settings: {
    upgradeSubscriptionModal: false,
    panelCollapsed: false,
    bottomSheet: false,
    /** 
     * *this playeractive represent whether the playerwrapper component is mounted or not.
     * *This will handle the panel height accordingly
    */
    playerActive: true,
    isPlaybackBlocked: false,
  },
  loading: false,
  focused: false,
  hostPlayback: {
    playing: false,
  },
  dailyUsage: null,
  watchLimitNudgeShown: false,
};

const roomSlice = createSlice({
  name: "room",
  initialState,
  reducers: {
    setRoom: (state, action: PayloadAction<RoomCreateResponse>) => {
      const data = action.payload.data;
      state.haveRoom = true;
      state.roomId = data.room_id;
      state.host = action.payload.authId === action.payload.data.user_id;
      state.playlist = state.host
        ? data.playlist.map((item) => {
            // if (index === 0) {
            //   return { ...item, selected: true };
            // }
            // return { ...item, selected: false };
            return {...item}
          }) || []
        : data.playlist;
      // Backend now uses type and source directly
      state.refer = false;
      state.hostPlayback.playing = false;
      state.settings.bottomSheet = false;
      state.settings.isPlaybackBlocked = false;
      state.settings.playbackBlockedInfo = undefined;
      state.dailyUsage = null;
      state.watchLimitNudgeShown = false;
      state.loading = false;
      // state.selectedIndex = data.playlist.findIndex((item) => item.selected) || 0;
    },
    exitRoom: (state) => {
      state.haveRoom = false;
      state.loading = false;
      state.roomId = null;
      state.hostPlayback.playing = false;
      state.settings.bottomSheet = false;
      state.settings.isPlaybackBlocked = false;
      state.settings.playbackBlockedInfo = undefined;
      state.dailyUsage = null;
      state.watchLimitNudgeShown = false;
      // state.event = action.payload;
    },
    setPlaylist: (state, action: PayloadAction<Playlist[]>) => {
      state.playlist = action.payload;
      // state.selectedIndex = action.payload.findIndex((item) => item.selected) || 0;
    },
    setScreenSharing: (state, action: PayloadAction<Playlist>) => {
      // Remove any existing screen sharing items to avoid duplicates
      const otherItems = state.playlist
        .filter((item) => item.source !== "screen")
        .map((item) => ({ ...item, selected: false }));

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
      }>,
    ) => {
      if (action.payload.playlist !== undefined) {
        state.playlist = action.payload.playlist;
        // state.selectedIndex = action.payload.playlist.findIndex((item) => item.selected) || 0;
      }
    },
    cleanScreenSourcePlaylist: (state) => {
      state.playlist = state.playlist.filter(
        (item) => item.source !== "screen",
      );
      // state.selectedIndex = state.playlist.findIndex((item) => item.selected) || 0;
    },
    setPanelCollapsed: (state, action: PayloadAction<Partial<RoomSetting>>) => {
      state.settings = {
        ...state.settings,
        ...action.payload,
      };
    },
    setBottomSheet: (state, action: PayloadAction<boolean>) => {
      state.settings.bottomSheet = action.payload;
    },
    toggleBottomSheet: (state) => {
      state.settings.bottomSheet = !state.settings.bottomSheet;
    },
    setPlayerActive: (state, action: PayloadAction<boolean>) => {
      state.settings.playerActive = action.payload;
    },
    setRefers: (
      state,
      action: PayloadAction<{
        refer: boolean;
      }>,
    ) => {
      state.refer = action.payload.refer;
    },
    setFocused: (state, action: PayloadAction<boolean>) => {
      state.focused = action.payload;
    },
    setHostPlaybackPlaying: (state, action: PayloadAction<boolean>) => {
      state.hostPlayback.playing = action.payload;
    },
    setUpgradeSubscriptionModal: (
      state,
      action: PayloadAction<{ open: boolean; message?: string; context?: "room_full" | "watch_time_session" }>,
    ) => {
      state.settings.upgradeSubscriptionModal = action.payload.open;
      if (action.payload.message) {
        state.settings.upgradeSubscriptionMessage = action.payload.message;
      }
      if (action.payload.context) {
        state.settings.upgradeSubscriptionContext = action.payload.context;
      }
    },
    setPlaybackBlocked: (
      state,
      action: PayloadAction<{ remainingMinutes: number; limit: number; planName: string }>,
    ) => {
      state.settings.isPlaybackBlocked = true;
      state.settings.playbackBlockedInfo = action.payload;
    },
    setDailyUsage: (
      state,
      action: PayloadAction<{ remainingMinutes: number; limit: number }>,
    ) => {
      state.dailyUsage = action.payload;
    },
    markWatchLimitNudgeShown: (state) => {
      state.watchLimitNudgeShown = true;
    },
  },
  // extraReducers: (builder) => {
  //   builder.addMatcher(
  //     (action: AnyAction) => action.type === "__rtkq/focused",
  //     (state) => {
  //       state.focused = true;
  //     },
  //   );
  // },
});

export const {
  setRoom,
  exitRoom,
  setLoading,
  setPanelCollapsed,
  setBottomSheet,
  toggleBottomSheet,
  setPlayerActive,
  setRefers,
  updateRoomInfo,
  setFocused,
  setPlaylist,
  setScreenSharing,
  cleanScreenSourcePlaylist,
  setHostPlaybackPlaying,
  setUpgradeSubscriptionModal,
  setPlaybackBlocked,
  setDailyUsage,
  markWatchLimitNudgeShown,
} = roomSlice.actions;
export default roomSlice;
