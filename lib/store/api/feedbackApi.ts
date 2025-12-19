import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export interface FeedbackInput {
  title: string;
  description: string;
  category: "bug" | "feature" | "other";
  room_id?: string;
  room_details?: object; // Redux snapshot
}

const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8989";

export const feedbackApi = createApi({
  reducerPath: "feedbackApi",
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
  endpoints: (builder) => ({
    submitFeedback: builder.mutation<any, FeedbackInput>({
      query: (data) => ({
        url: "/feedback",
        method: "POST",
        body: data,
      }),
    }),
  }),
});

export const { useSubmitFeedbackMutation } = feedbackApi;
