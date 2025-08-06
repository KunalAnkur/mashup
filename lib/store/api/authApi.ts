import { UserLoginResp } from "@/types/responseTypes";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl}/api/v1/auth`,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as any).auth?.token;
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  endpoints: (builder) => ({
    login: builder.mutation<UserLoginResp, { email: string; password: string }>(
      {
        query: ({ email, password }: { email: string; password: string }) => ({
          url: "/login",
          method: "POST",
          body: { email, password },
        }),
      }
    ),
    signup: builder.mutation<
      UserLoginResp,
      {
        email: string;
        username: string;
        password: string;
        confirmPassword: string;
      }
    >({
      query: ({
        email,
        password,
        username,
        confirmPassword,
      }: {
        email: string;
        username: string;
        password: string;
        confirmPassword: string;
      }) => ({
        url: "/signup",
        method: "POST",
        body: { email, password, confirm_password: confirmPassword, username },
      }),
    }),
    verifyToken: builder.mutation<any, void>({
      query: () => ({
        url: "/verify-token",
        method: "POST",
      }),
    }),
    checkToken: builder.query<any, string>({
      query: (token) => ({
        url: "/verify-token",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }),
    }),
    providerLogin: builder.mutation<
      UserLoginResp,
      {
        email: string;
        name: string;
        picture: string;
        sub: string;
        provider_name: string;
      }
    >({
      query: ({ email, name, picture, sub, provider_name }) => ({
        url: "/login-provider",
        method: "POST",
        body: {
          email,
          name,
          picture,
          provider: {
            provider_name,
            provider_user_id: sub,
          },
        },
      }),
    }),
    providerSignup: builder.mutation<
      UserLoginResp,
      {
        email: string;
        name: string;
        picture: string;
        sub: string;
        provider_name: string;
      }
    >({
      query: ({ email, name, picture, sub, provider_name }) => ({
        url: "/signup-provider",
        method: "POST",
        body: {
          email,
          name,
          picture,
          provider: {
            provider_name,
            provider_user_id: sub,
          },
        },
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useSignupMutation,
  useVerifyTokenMutation,
  useCheckTokenQuery,
  useProviderLoginMutation,
  useProviderSignupMutation
} = authApi;
