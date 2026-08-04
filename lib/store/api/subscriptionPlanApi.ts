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
      // Postgres DECIMAL arrives as a string over JSON; the derived figures are already
      // numbers from guardian but are coerced too so nothing downstream has to guess.
      price: Number(item.price),
      monthly_equivalent_price:
        item.monthly_equivalent_price != null ? Number(item.monthly_equivalent_price) : undefined,
      compare_at_monthly_price:
        item.compare_at_monthly_price != null ? Number(item.compare_at_monthly_price) : null,
      savings_percent: item.savings_percent != null ? Number(item.savings_percent) : null,
      billed_amount: item.billed_amount != null ? Number(item.billed_amount) : undefined,
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
