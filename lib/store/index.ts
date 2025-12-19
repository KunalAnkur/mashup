import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query/react";
import authSlice from "./slices/authSlice";
import roomSlice from "./slices/roomSlice";
import onboardSlice from "./slices/onboardSlice";
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
import { feedbackApi } from "./api/feedbackApi";

// 1. Combine reducers
const rootReducer = combineReducers({
  [authSlice.reducerPath]: authSlice.reducer,
  [onboardSlice.reducerPath]: onboardSlice.reducer,
  [roomSlice.reducerPath]: roomSlice.reducer,
  [authApi.reducerPath]: authApi.reducer,
  [roomApi.reducerPath]: roomApi.reducer,
  [userApi.reducerPath]: userApi.reducer,
  [feedbackApi.reducerPath]: feedbackApi.reducer,
});

// 2. Persist config
const persistConfig = {
  key: "root",
  storage,
  whitelist: [authSlice.reducerPath, onboardSlice.reducerPath], // only persist `auth` slice
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
    }).concat(authApi.middleware, roomApi.middleware, userApi.middleware, feedbackApi.middleware),
  devTools: process.env.NODE_ENV !== "production",
});

// 5. Create persistor
export const persistor = persistStore(store);

// 6. Types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

setupListeners(store.dispatch);
