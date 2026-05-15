import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AuthState } from "@/types/storeTypes";
import { UserLoginResp } from "@/types/responseTypes";

/**
 * Initial authentication state
 */
const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

/**
 * Auth Slice
 * 
 * Manages authentication state including:
 * - User information
 * - Authentication token
 * - Authentication status
 * - Loading states
 * - Error states
 */
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    /**
     * Set user data after successful login/signup
     * Transforms API response into normalized user state
     */
    setUser: (state, action: PayloadAction<UserLoginResp>) => {
      const { user, token } = action.payload.data;

      // Normalize user data with proper fallbacks
      state.user = {
        id: user.id,
        name: user.name || user.username || "User",
        email: user.email,
        username: user.username,
        profile: user.profile || "",
        sessionId: user.session_id,
        isEmailVerified: user.is_email_verified,
        isGuestUser: user.guest_account,
        marketingEmailsOptIn: user.marketing_emails_opt_in ?? null,
      };

      state.token = token;
      state.isAuthenticated = true;
      state.loading = false;
      state.error = null;
    },

    /**
     * Update user profile with Google OAuth data
     * Used specifically for Google OAuth users to set profile picture and name
     */
    setGoogleUser: (
      state,
      action: PayloadAction<{
        profilePicture: string;
        name: string;
        email: string;
      }>
    ) => {
      if (!state.user) {
        console.warn("Cannot update Google user: no user in state");
        return;
      }

      state.user.profile = action.payload.profilePicture;
      state.user.name = action.payload.name;
      state.user.email = action.payload.email;
    },

    /**
     * Update user profile information (name, username only - email cannot be updated)
     * Used when user updates their profile in settings
     */
    updateProfile: (
      state,
      action: PayloadAction<{
        name?: string;
        username?: string;
      }>
    ) => {
      if (!state.user) {
        console.warn("Cannot update profile: no user in state");
        return;
      }

      if (action.payload.name !== undefined) {
        state.user.name = action.payload.name;
      }
      if (action.payload.username !== undefined) {
        state.user.username = action.payload.username;
      }
      // Email is not updated - it remains read-only
    },

    /**
     * Clear authentication state and logout user
     * Resets all auth-related state to initial values
     */
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
    },

    /**
     * Set loading state
     * Used for async operations that need loading indicators
     */
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },

    /**
     * Set error message
     * Used to display authentication errors to the user
     */
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.loading = false;
    },

    /**
     * Clear error message
     * Resets error state
     */
    clearError: (state) => {
      state.error = null;
    },

    setMarketingOptIn: (state, action: PayloadAction<boolean>) => {
      if (state.user) {
        state.user.marketingEmailsOptIn = action.payload;
      }
    },

    /**
     * Reset authentication state to initial values
     * Useful for cleanup or reset scenarios
     */
    resetAuth: (state) => {
      Object.assign(state, initialState);
    },
  },
});

export const {
  setUser,
  setGoogleUser,
  updateProfile,
  logout,
  setLoading,
  setError,
  clearError,
  resetAuth,
  setMarketingOptIn,
} = authSlice.actions;

export default authSlice;
