import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { SubscriptionState, UserSubscription } from "@/types/subscriptionTypes";

/**
 * Initial subscription state
 */
const initialState: SubscriptionState = {
  subscription: null,
  loading: false,
  error: null,
};

/**
 * Subscription Slice
 * 
 * Manages user subscription state including:
 * - Current subscription details
 * - Plan information
 * - Features and limits
 * - Loading states
 * - Error states
 */
const subscriptionSlice = createSlice({
  name: "subscription",
  initialState,
  reducers: {
    /**
     * Set subscription data
     */
    setSubscription: (state, action: PayloadAction<UserSubscription>) => {
      state.subscription = action.payload;
      state.loading = false;
      state.error = null;
    },

    /**
     * Set loading state
     */
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },

    /**
     * Set error state
     */
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.loading = false;
    },

    /**
     * Clear subscription data (on logout)
     */
    clearSubscription: (state) => {
      state.subscription = null;
      state.loading = false;
      state.error = null;
    },
  },
});

export const {
  setSubscription,
  setLoading,
  setError,
  clearSubscription,
} = subscriptionSlice.actions;

export default subscriptionSlice;

// Made with Bob
