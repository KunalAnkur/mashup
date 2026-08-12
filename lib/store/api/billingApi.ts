import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RootState } from "@/lib/store";
import { PaymentStatus } from "@/types/subscriptionTypes";

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

export type PlanChangeDirection = "upgrade" | "downgrade";

export interface PaymentTransactionSummary {
  id: string;
  /** The gateway's reference — what the history is searchable by and what support quotes. */
  transactionId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  planSlug: string | null;
  planName: string | null;
  direction: PlanChangeDirection | null;
  /** Hosted receipt. Null for a charge that never completed, and for older rows. */
  invoiceUrl: string | null;
  createdAt: string;
}

export interface TransactionHistoryResponse {
  success: boolean;
  message: string;
  data: PaymentTransactionSummary[];
}

export interface PlanChangePreviewResponse {
  success: boolean;
  message: string;
  data: {
    direction: PlanChangeDirection;
    currentPlan: { id: string; name: string; slug: string; price: number };
    targetPlan: { id: string; name: string; slug: string; price: number };
    amountDueToday: number;
    currency: string;
    effectiveAt: "immediately" | "next_billing_date";
    nextBillingDate: string | null;
  };
}

export interface ChangePlanResponse {
  success: boolean;
  message: string;
  data: { direction: PlanChangeDirection };
}

function normalizePreview(response: PlanChangePreviewResponse): PlanChangePreviewResponse {
  return {
    ...response,
    data: {
      ...response.data,
      currentPlan: { ...response.data.currentPlan, price: Number(response.data.currentPlan.price) },
      targetPlan: { ...response.data.targetPlan, price: Number(response.data.targetPlan.price) },
      amountDueToday: Number(response.data.amountDueToday),
    },
  };
}

function normalizeTransactions(response: TransactionHistoryResponse): TransactionHistoryResponse {
  return {
    ...response,
    data: response.data.map((tx) => ({ ...tx, amount: Number(tx.amount) })),
  };
}

export const billingApi = createApi({
  reducerPath: "billingApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl}/api/v1/billing`,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth?.token;
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  endpoints: (builder) => ({
    previewChangePlan: builder.query<PlanChangePreviewResponse, string>({
      query: (planSlug) => ({
        url: "/change-plan/preview",
        method: "GET",
        params: { plan_slug: planSlug },
      }),
      transformResponse: normalizePreview,
    }),
    changePlan: builder.mutation<ChangePlanResponse, string>({
      query: (planSlug) => ({
        url: "/change-plan",
        method: "POST",
        body: { plan_slug: planSlug },
      }),
    }),
    cancelChangePlan: builder.mutation<{ success: boolean }, void>({
      query: () => ({
        url: "/change-plan/cancel",
        method: "POST",
      }),
    }),
    getMyTransactions: builder.query<TransactionHistoryResponse, void>({
      query: () => ({
        url: "/transactions",
        method: "GET",
      }),
      transformResponse: normalizeTransactions,
    }),
  }),
});

export const {
  useLazyPreviewChangePlanQuery,
  useChangePlanMutation,
  useCancelChangePlanMutation,
  useGetMyTransactionsQuery,
} = billingApi;
