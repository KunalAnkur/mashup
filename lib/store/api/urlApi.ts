import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

export const urlApi = createApi({
  reducerPath: "urlApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl}/api/v1/url`,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as any).auth?.token;
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  endpoints: (builder) => ({
    getUrlMetadata: builder.mutation<any, string>({
      query: (url) => ({
        url: `/metadata`,
        method: "POST",
        body: { url },
      }),
    }),
  }),
});

export const {
  useGetUrlMetadataMutation,
} = urlApi;
