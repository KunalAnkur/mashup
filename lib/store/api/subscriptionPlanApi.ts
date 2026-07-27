import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { SubscriptionPlan } from "@/types/subscriptionTypes";

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizePlans(payload: unknown): SubscriptionPlan[] {
  const rawPlans = isRecord(payload) && Array.isArray(payload.data) ? payload.data : [];

  return rawPlans
    .filter((item): item is Record<string, unknown> => isRecord(item))
    .map((item) => ({
      ...item,
      price: Number(item.price),
    })) as SubscriptionPlan[];
}

export const subscriptionPlanApi = createApi({
  reducerPath: "subscriptionPlanApi",
  baseQuery: fetchBaseQuery({ baseUrl: `${baseUrl}/api/v1` }),
  endpoints: (builder) => ({
    getSubscriptionPlans: builder.query<SubscriptionPlan[], void>({
      query: () => ({ url: "/subscription-plans", method: "GET" }),
      transformResponse: (response: unknown) => normalizePlans(response),
    }),
  }),
});

export const { useGetSubscriptionPlansQuery } = subscriptionPlanApi;
