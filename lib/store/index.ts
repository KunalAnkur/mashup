import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query/react";
import authSlice from "./slices/authSlice";
import roomSlice from "./slices/roomSlice";
import onboardSlice from "./slices/onboardSlice";
import productSlice from "./slices/productSlice";
import subscriptionSlice from "./slices/subscriptionSlice";
import {
  persistReducer,
  persistStore,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";
import storage from "redux-persist/lib/storage"; // defaults to localStorage for web
import { authApi } from "./api/authApi";
import { roomApi } from "./api/roomApi";
import { userApi } from "./api/userApi";
import { urlApi } from "./api/urlApi";
import { feedbackApi } from "./api/feedbackApi";
import { productApi } from "./api/productApi";
import { youtubeApi } from "./api/youtubeApi";
import { subscriptionPlanApi } from "./api/subscriptionPlanApi";
import { billingApi } from "./api/billingApi";

// 1. Combine reducers
const rootReducer = combineReducers({
  [authSlice.reducerPath]: authSlice.reducer,
  [onboardSlice.reducerPath]: onboardSlice.reducer,
  [roomSlice.reducerPath]: roomSlice.reducer,
  [productSlice.reducerPath]: productSlice.reducer,
  [subscriptionSlice.reducerPath]: subscriptionSlice.reducer,
  [authApi.reducerPath]: authApi.reducer,
  [roomApi.reducerPath]: roomApi.reducer,
  [userApi.reducerPath]: userApi.reducer,
  [urlApi.reducerPath]: urlApi.reducer,
  [feedbackApi.reducerPath]: feedbackApi.reducer,
  [productApi.reducerPath]: productApi.reducer,
  [youtubeApi.reducerPath]: youtubeApi.reducer,
  [subscriptionPlanApi.reducerPath]: subscriptionPlanApi.reducer,
  [billingApi.reducerPath]: billingApi.reducer,
});

// 2. Persist config
const persistConfig = {
  key: "root",
  storage,
  whitelist: [authSlice.reducerPath, onboardSlice.reducerPath, subscriptionSlice.reducerPath], // persist auth, onboard, and subscription slices
};

// 3. Apply persistReducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// 4. Configure store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat(
      authApi.middleware,
      roomApi.middleware,
      userApi.middleware,
      urlApi.middleware,
      feedbackApi.middleware,
      productApi.middleware,
      youtubeApi.middleware,
      subscriptionPlanApi.middleware,
      billingApi.middleware
    ),
  devTools: process.env.NODE_ENV !== "production",
});

// 5. Create persistor
export const persistor = persistStore(store);

// 6. Types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

setupListeners(store.dispatch);
