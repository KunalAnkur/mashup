import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { AuthState, RoomState } from "@/types/storeTypes";
import { RoomCreateResponse, UserLoginResp } from "@/types/responseTypes";

const initialState: RoomState = {
  haveRoom: false,
  sourceType: null,
  roomId: null,
  url: null,
  loading: false,
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
      state.url = data.url || null;
      state.sourceType = data.source_type as "file" | "url";
    },
    setFile: (state, action: PayloadAction<string[]>) => {
      state.file = action.payload;
    },
    exitRoom: (state) => {
      state.haveRoom = false;
      state.loading = false;
      state.roomId = null;
      state.sourceType = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
  },
  extraReducers: (builder) => {},
});

export const { setRoom, exitRoom, setLoading, setFile } = authSlice.actions;
export default authSlice;
