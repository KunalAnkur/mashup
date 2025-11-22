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
            name: user.name || user.username || 'User', // Fallback to username or 'User'
            email: user.email,
            profile: user.profile || '', // Fallback to empty string
            username: user.username,
            sessionId: user.session_id,
            id: user.id,
        };
        state.isAuthenticated = true;
        state.loading = false;
        state.token = action.payload.data.token;
    },
    
    // Special action for Google OAuth users to set profile picture
    setGoogleUser: (state, action: PayloadAction<{ profilePicture: string; name: string; email: string }>) => {
        if (state.user) {
            state.user.profile = action.payload.profilePicture;
            state.user.name = action.payload.name;
            state.user.email = action.payload.email;
        }
    },
    logout(state) {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.loading = false;
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

export const { logout, setUser, setGoogleUser, checkUserToken, setLoading } = authSlice.actions;
export default authSlice;
