import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { OnboardSourceInfo, OnboardState, OnboardStatus, OnboardStep } from "@/types/storeTypes";

const initialState: OnboardState = {
  status: OnboardStatus.IN_PROGRESS,
  step: OnboardStep.SELECT_SOURCE,
  info: null,
  loading: false,
};

const authSlice = createSlice({
  name: "onboard",
  initialState,
  reducers: {
    changeStep: (state, action: PayloadAction<OnboardStep>) => {
      state.step = action.payload;
    },
    updateSourceInfo: (state, action: PayloadAction<OnboardSourceInfo>) => {
      state.info = action.payload;
    },
  },
});

export const { changeStep, updateSourceInfo } = authSlice.actions;
export default authSlice;
