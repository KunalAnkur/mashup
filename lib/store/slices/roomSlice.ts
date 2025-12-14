import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RoomSetting, RoomState, UrlMetadata } from "@/types/storeTypes";
import { RoomCreateResponse } from "@/types/responseTypes";

const initialState: RoomState = {
  haveRoom: false,
  type: 'sync',
  source: 'url',
  roomId: null,
  urls: [],
  files: [],
  selectedFileIndex: 0,
  host: false,
  refer: false,
  settings: {
    panelCollapsed: false
  },
  loading: false,
  focused: false,
  urlMetadataCache: {},
};

const authSlice = createSlice({
  name: "room",
  initialState,
  reducers: {
    setRoom: (state, action: PayloadAction<RoomCreateResponse>) => {
      const data = action.payload.data;
      state.haveRoom = true;
      state.loading = false;
      state.roomId = data.room_id;
      state.urls = data.urls || [];
      state.host = action.payload.authId === action.payload.data.user_id;
      // Backend now uses type and source directly
      state.type = data.type as "stream" | "sync";
      state.source = data.source as "file" | "url" | "stream";
      state.refer = false;
    },
    setFile: (state, action: PayloadAction<string[]>) => {
      state.files = action.payload;
    },
    exitRoom: (state) => {
      state.haveRoom = false;
      state.loading = false;
      state.roomId = null;
      state.type = 'sync';
      state.source = 'url';
      // state.event = action.payload;
    },
    setSelectedFileIndex: (state, action: PayloadAction<number>) => {
      state.selectedFileIndex = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setUrls: (state, action: PayloadAction<string[]>) => {
      state.urls = action.payload;
    },
    updateRoomInfo: (
      state,
      action: PayloadAction<{
        urls?: string[];
        files?: string[];
        selectedFileIndex?: number;
        source?: "file" | "url" | "stream";
        type?: "stream" | "sync";
      }>
    ) => {
      if (action.payload.urls !== undefined) {
        state.urls = action.payload.urls;
      }
      if (action.payload.files !== undefined) {
        state.files = action.payload.files;
      }
      if (action.payload.selectedFileIndex !== undefined) {
        state.selectedFileIndex = action.payload.selectedFileIndex;
      }
      if (action.payload.source !== undefined) {
        state.source = action.payload.source;
      }
      if (action.payload.type !== undefined) {
        state.type = action.payload.type;
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
        type: "stream" | "sync";
        source: "file" | "url" | "stream";
        urls?: string[];
        files?: string[];
      }>
    ) => {
      state.refer = action.payload.refer;
      state.type = action.payload.type;
      state.source = action.payload.source;
      state.urls = action.payload.urls || [];
      state.files = action.payload.files || [];
    },
    
    /** Cache metadata for a single URL */
    setUrlMetadata: (
      state,
      action: PayloadAction<{ url: string; metadata: UrlMetadata }>
    ) => {
      state.urlMetadataCache[action.payload.url] = action.payload.metadata;
    },
    
    /** Cache metadata for multiple URLs at once */
    setUrlMetadataBatch: (
      state,
      action: PayloadAction<Record<string, UrlMetadata>>
    ) => {
      state.urlMetadataCache = {
        ...state.urlMetadataCache,
        ...action.payload,
      };
    },
    
    /** Clear URL metadata cache */
    clearUrlMetadataCache: (state) => {
      state.urlMetadataCache = {};
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
  setFile,
  setSelectedFileIndex,
  setPanelCollapsed,
  setRefers,
  setUrls,
  updateRoomInfo,
  setUrlMetadata,
  setUrlMetadataBatch,
  clearUrlMetadataCache,
  setFocused,
} = authSlice.actions;
export default authSlice;
