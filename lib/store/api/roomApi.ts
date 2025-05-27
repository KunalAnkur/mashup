import { RoomCreateResponse } from "@/types/responseTypes";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

export const roomApi = createApi({
  reducerPath: "roomApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl}/api/v1/room`,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as any).auth?.token;
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  endpoints: (builder) => ({
    // POST /api/v1/room/
    createRoom: builder.mutation<
      RoomCreateResponse,
      { url?: string; sourceType: "file" | "url" }
    >({
      query: (body: { url?: string; sourceType: "file" | "url" }) => ({
        url: `/`,
        method: "POST",
        body: {
          url: body.url,
          source_type: body.sourceType,
        },
      }),
    }),
    // GET /api/v1/room/my-room
    getMyRoom: builder.mutation<any, void>({
      query: () => ({
        url: `/my-room`,
        method: "GET",
      }),
    }),
    // GET /api/v1/room/
    getRoomsByQuery: builder.query<any, Record<string, any>>({
      query: (params) => ({
        url: `/`,
        method: "GET",
        params,
      }),
    }),
    // GET /api/v1/room/:id
    getRoomById: builder.query<any, string>({
      query: (id) => ({
        url: `/${id}`,
        method: "GET",
      }),
    }),
    // PUT /api/v1/room/:id
    updateRoom: builder.mutation<any, { id: string; body: any }>({
      query: ({ id, body }) => ({
        url: `/${id}`,
        method: "PUT",
        body,
      }),
    }),
    // PUT /api/v1/room/:id/inactive
    inactiveRoom: builder.mutation<any, string>({
      query: (id) => ({
        url: `/${id}/inactive`,
        method: "PUT",
      }),
    }),

    inactiveMyRoom: builder.mutation<any, void>({
      query: () => ({
        url: `/inactive-my-room`,
        method: "PUT",
      }),
    }),
    // DELETE /api/v1/room/:id
    deleteRoom: builder.mutation<any, string>({
      query: (id) => ({
        url: `/${id}`,
        method: "DELETE",
      }),
    }),
  }),
});

export const {
  useCreateRoomMutation,
  useGetMyRoomMutation,
  useGetRoomsByQueryQuery,
  useGetRoomByIdQuery,
  useUpdateRoomMutation,
  useInactiveRoomMutation,
  useDeleteRoomMutation,
  useInactiveMyRoomMutation
} = roomApi;
