import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

export type UrlMetadataResponseItem = {
  url: string;
  title?: string;
  description?: string;
  thumbnail?: string;
  author?: string;
  siteName?: string;
  link?: string;
};

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
    getUrlMetadata: builder.mutation<UrlMetadataResponseItem[], string>({
      query: (url) => ({
        url: `/metadata`,
        method: "POST",
        body: { url },
      }),
      transformResponse: (response: { data?: UrlMetadataResponseItem[] }) =>
        Array.isArray(response?.data) ? response.data : [],
    }),
  }),
});

export const {
  useGetUrlMetadataMutation,
} = urlApi;
