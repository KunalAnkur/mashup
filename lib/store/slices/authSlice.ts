import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { AuthState } from "@/types/storeTypes";
import { UserLoginResp } from "@/types/responseTypes";

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<UserLoginResp>) => {
        console.log(action.payload)
        const user = action.payload.data.user;
        state.user = {
            name: user.name,
            email: user.email,
            profile: user.profile,
            username: user.username ,
            sessionId: user.session_id,
            id: user.id,
        };
        state.isAuthenticated = true;
        state.loading = false;
        state.token = action.payload.data.token;
    },
    logout(state) {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
    },
    // this action will move to api section
    checkUserToken: (state) => {
      state.loading = true;
      // state.isAuthenticated = false;
      state.loading = false;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    }
  },
  extraReducers: (builder) => {},
});

export const { logout, setUser, checkUserToken, setLoading } = authSlice.actions;
export default authSlice;
