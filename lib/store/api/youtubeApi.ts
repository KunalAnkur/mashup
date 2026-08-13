import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

/**
 * One video, exactly as guardian normalises it.
 *
 * Numbers stay numbers and timestamps stay timestamps — "1.2M views" and "3 days ago"
 * are formatting, and formatting happens where the viewer's locale is known.
 */
export interface YouTubeVideoCard {
  videoId: string;
  title: string;
  thumbnail: string;
  channelId: string;
  channelTitle: string;
  channelThumbnail?: string;
  /** Seconds. 0 for a live stream. */
  durationSeconds: number;
  isLive: boolean;
  viewCount: number;
  publishedAt: string;
  /** Ready to open a room with — this side never assembles a YouTube URL. */
  url: string;
}

export interface YouTubeCategory {
  id: string;
  title: string;
}

export interface YouTubeBrowseResult {
  items: YouTubeVideoCard[];
  nextPageToken?: string;
}

interface Envelope<T> {
  success: boolean;
  message: string;
  data: T;
}

/**
 * Browsing is public, so no auth header: guardian rate-limits these per IP, and the
 * expensive one (search) is additionally capped by a shared daily quota budget.
 */
export const youtubeApi = createApi({
  reducerPath: "youtubeApi",
  baseQuery: fetchBaseQuery({ baseUrl: `${baseUrl}/api/v1/youtube` }),
  endpoints: (builder) => ({
    getTrending: builder.query<
      YouTubeBrowseResult,
      { region?: string; categoryId?: string } | void
    >({
      query: (args) => ({
        url: "/trending",
        params: {
          ...(args?.region ? { region: args.region } : {}),
          ...(args?.categoryId ? { categoryId: args.categoryId } : {}),
        },
      }),
      transformResponse: (response: Envelope<YouTubeBrowseResult>) =>
        response?.data ?? { items: [] },
    }),

    getCategories: builder.query<YouTubeCategory[], { region?: string } | void>({
      query: (args) => ({
        url: "/categories",
        params: args?.region ? { region: args.region } : {},
      }),
      transformResponse: (response: Envelope<YouTubeCategory[]>) => response?.data ?? [],
    }),

    searchVideos: builder.query<YouTubeBrowseResult, { q: string; region?: string }>({
      query: ({ q, region }) => ({
        url: "/browse/search",
        params: { q, ...(region ? { region } : {}) },
      }),
      transformResponse: (response: Envelope<YouTubeBrowseResult>) =>
        response?.data ?? { items: [] },
    }),
  }),
});

export const {
  useGetTrendingQuery,
  useGetCategoriesQuery,
  useSearchVideosQuery,
  useLazySearchVideosQuery,
} = youtubeApi;
