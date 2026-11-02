"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useSelector } from "react-redux";
import {
  appEntryActionButtonBaseClass,
  appEntryPrimaryButtonClass,
  appEntrySecondaryButtonClass,
  pricingFailureReasonClass,
} from "@/components/UI/classTokens";
import { trackCheckoutFailed } from "@/lib/analytics";
import type { RootState } from "@/lib/store";
import { useGetMyTransactionsQuery } from "@/lib/store/api/billingApi";
import { PaymentStatus } from "@/types/subscriptionTypes";

/**
 * How long to keep asking guardian for the failed charge. Dodo redirects the buyer here at
 * the same moment it fires the payment.failed webhook, so the row usually lands a second or
 * two after this page does — but it can lag, and polling forever for a charge that was
 * never made (an abandoned checkout also ends up here) would be pointless.
 */
const LOOKUP_WINDOW_MS = 30_000;
const LOOKUP_INTERVAL_MS = 3_000;

/**
 * Without a payment_id in the return URL, the newest failed charge is only trusted as
 * "this one" if it is recent — otherwise an old decline would be explained as today's.
 */
const RECENT_FAILURE_MS = 15 * 60 * 1000;

export default function FailurePage() {
  const searchParams = useSearchParams();
  const status = (searchParams.get("status") || "").toLowerCase();
  const paymentId = searchParams.get("payment_id");

  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const [landedAt] = useState(() => Date.now());
  const [lookupExpired, setLookupExpired] = useState(false);

  useEffect(() => {
    trackCheckoutFailed(status);
    // Analytics fires once per landing, not again if the query string is rewritten.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setLookupExpired(true), LOOKUP_WINDOW_MS);
    return () => window.clearTimeout(timer);
  }, []);

  // A cancelled checkout never reached a charge, so there is no reason to look up.
  const canLookUp = isAuthenticated && (!!paymentId || status === "failed");

  const { data } = useGetMyTransactionsQuery(undefined, { skip: !canLookUp });

  const failed = useMemo(() => {
    const transactions = data?.data ?? [];
    if (paymentId) {
      const match = transactions.find((tx) => tx.transactionId === paymentId);
      return match?.status === PaymentStatus.FAILED ? match : null;
    }
    return (
      transactions
        .filter(
          (tx) =>
            tx.status === PaymentStatus.FAILED &&
            landedAt - new Date(tx.createdAt).getTime() <= RECENT_FAILURE_MS,
        )
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] ??
      null
    );
  }, [data, paymentId, landedAt]);

  // Re-subscribed with polling only while we are still waiting for the webhook to land.
  useGetMyTransactionsQuery(undefined, {
    skip: !canLookUp || !!failed || lookupExpired,
    pollingInterval: LOOKUP_INTERVAL_MS,
  });

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="max-w-xl w-full rounded-2xl border border-white/10 bg-black/30 p-8 text-center">
        <h1 className="text-3xl font-semibold text-white">Payment failed</h1>
        {failed?.failureMessage ? (
          <>
            <p className={pricingFailureReasonClass}>{failed.failureMessage}</p>
            <p className="mt-3 text-[12px] text-white/45">
              Reference: <span className="font-mono">{failed.transactionId}</span>
            </p>
          </>
        ) : (
          <p className="mt-3 text-white/70">
            Your payment couldn&apos;t be completed. No charges were made. You can try again
            anytime.
          </p>
        )}
        <div className="mt-6 flex gap-3 justify-center">
          <Link
            href="/pricing"
            className={`${appEntryActionButtonBaseClass} ${appEntryPrimaryButtonClass}`}
          >
            Try again
          </Link>
          <Link
            href="/"
            className={`${appEntryActionButtonBaseClass} ${appEntrySecondaryButtonClass}`}
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
