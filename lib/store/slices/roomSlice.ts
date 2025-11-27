import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RoomSetting, RoomState, UrlMetadata } from "@/types/storeTypes";
import { RoomCreateResponse } from "@/types/responseTypes";

const initialState: RoomState = {
  haveRoom: false,
  sourceType: 'url',
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
      state.sourceType = data.source_type as "file" | "url";
      state.refer = false;
    },
    setFile: (state, action: PayloadAction<string[]>) => {
      state.files = action.payload;
    },
    exitRoom: (state) => {
      state.haveRoom = false;
      state.loading = false;
      state.roomId = null;
      state.sourceType = 'url';
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
        sourceType: "file" | "url";
        urls?: string[];
      }>
    ) => {
      state.refer = action.payload.refer;
      state.sourceType = action.payload.sourceType;
      state.urls = action.payload.urls || [];
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
  setUrlMetadata,
  setUrlMetadataBatch,
  clearUrlMetadataCache,
} = authSlice.actions;
export default authSlice;
