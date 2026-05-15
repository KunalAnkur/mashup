import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { UserSubscription } from "@/types/subscriptionTypes";

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

export interface UpdateProfileRequest {
  id: string;
  name?: string;
  username?: string;
  // Email cannot be updated
}

export interface UpdateProfileResponse {
  success: boolean;
  status: string;
  message: string;
  data: {
    id: string;
    email: string;
    username: string;
    name: string;
    picture: string;
    is_email_verified: boolean;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  };
}

export interface GetSubscriptionResponse {
  success: boolean;
  status: string;
  message: string;
  data: UserSubscription;
}

export const userApi = createApi({
  reducerPath: "userApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl}/api/v1/user`,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as any).auth?.token;
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  endpoints: (builder) => ({
    // PUT /api/v1/user/:id - Update user profile (name, username only - email cannot be updated)
    updateProfile: builder.mutation<UpdateProfileResponse, UpdateProfileRequest>({
      query: ({ id, name, username }) => ({
        url: `/${id}`,
        method: "PUT",
        body: {
          name,
          username,
        },
      }),
    }),
    // GET /api/v1/user/:id - Get user by ID
    getUserById: builder.query<UpdateProfileResponse, string>({
      query: (id) => ({
        url: `/${id}`,
        method: "GET",
      }),
    }),
    // GET /api/v1/user/subscription/me - Get current user's subscription
    getMySubscription: builder.query<GetSubscriptionResponse, void>({
      query: () => ({
        url: "/subscription/me",
        method: "GET",
      }),
    }),
    cancelMySubscription: builder.mutation<GetSubscriptionResponse, void>({
      query: () => ({
        url: "/subscription/cancel",
        method: "POST",
      }),
    }),
    updateMarketingPreference: builder.mutation<{ success: boolean }, { opt_in: boolean }>({
      query: ({ opt_in }) => ({
        url: "/marketing-preference",
        method: "POST",
        body: { opt_in },
      }),
    }),
  }),
});

export const {
  useUpdateProfileMutation,
  useGetUserByIdQuery,
  useGetMySubscriptionQuery,
  useLazyGetMySubscriptionQuery,
  useCancelMySubscriptionMutation,
  useUpdateMarketingPreferenceMutation,
} = userApi;
