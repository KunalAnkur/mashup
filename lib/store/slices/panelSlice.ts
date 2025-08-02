import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { PanelState } from "@/types/storeTypes";

const initialState: PanelState = {
  loading: false,
  people: [],
  chats: []

};

const panelSlice = createSlice({
  name: "panel",
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
        state.loading = action.payload;
    },
    setChat: (state, action: PayloadAction<PanelState>) => {
        
    }
  },
  extraReducers: (builder) => {},
});

export const { setLoading } = panelSlice.actions;
export default panelSlice;
