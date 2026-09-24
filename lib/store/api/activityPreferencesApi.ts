import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

/**
 * A game's settings for the signed-in player.
 *
 * `prefs` is opaque here, exactly as it is in guardian. This slice moves a blob between
 * a browser and a row and never looks inside it, which is what lets a game add a
 * setting without touching costume at all.
 */

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8989";

export type ActivityPrefs = Record<string, unknown>;

export interface PreferencesResponse {
  game_id: string;
  prefs: ActivityPrefs;
}

/** guardian wraps every payload in `{ success, status, message, data }`. */
interface Envelope<T> {
  data: T;
}

export const activityPreferencesApi = createApi({
  reducerPath: "activityPreferencesApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl}/api/v1`,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as any).auth?.token;
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      headers.set("Content-Type", "application/json");
      return headers;
    },
  }),
  tagTypes: ["ActivityPrefs"],
  endpoints: (builder) => ({
    getActivityPreferences: builder.query<PreferencesResponse, string>({
      query: (gameId) => `/activity-preferences/${gameId}`,
      transformResponse: (response: Envelope<PreferencesResponse>) => response.data,
      providesTags: (_result, _error, gameId) => [{ type: "ActivityPrefs", id: gameId }],
    }),

    /**
     * A whole-document write, not a patch.
     *
     * The client is local-first and always holds the complete settings object, so it
     * can always send the complete object — and a server-side merge would make
     * deleting a key impossible.
     */
    saveActivityPreferences: builder.mutation<
      PreferencesResponse,
      { gameId: string; prefs: ActivityPrefs }
    >({
      query: ({ gameId, prefs }) => ({
        url: `/activity-preferences/${gameId}`,
        method: "PUT",
        body: { prefs },
      }),
      transformResponse: (response: Envelope<PreferencesResponse>) => response.data,
      // Deliberately does not invalidate its own tag. The browser that just saved is
      // the source of truth for what it saved; refetching would round-trip a value we
      // already have and, on a slow link, briefly replace newer local edits with it.
    }),

    resetActivityPreferences: builder.mutation<PreferencesResponse, string>({
      query: (gameId) => ({ url: `/activity-preferences/${gameId}`, method: "DELETE" }),
      transformResponse: (response: Envelope<PreferencesResponse>) => response.data,
      invalidatesTags: (_result, _error, gameId) => [{ type: "ActivityPrefs", id: gameId }],
    }),
  }),
});

export const {
  useGetActivityPreferencesQuery,
  useSaveActivityPreferencesMutation,
  useResetActivityPreferencesMutation,
} = activityPreferencesApi;
