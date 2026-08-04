"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  appEntryActionButtonBaseClass,
  appEntryPrimaryButtonClass,
  appEntrySecondaryButtonClass,
} from "@/components/UI/classTokens";

export default function SuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const status = (searchParams.get("status") || "").toLowerCase();

  const qs = useMemo(() => searchParams.toString(), [searchParams]);

  const isFailure =
    status === "failed" || status === "cancelled" || status === "canceled";

  useEffect(() => {
    if (isFailure) {
      router.replace(`/pricing/failure${qs ? `?${qs}` : ""}`);
    }
  }, [isFailure, qs, router]);

  if (isFailure) {
    return null;
  }

  const isProcessing =
    status === "pending" ||
    status === "processing" ||
    status === "requires_payment_method" ||
    status === "requires_action" ||
    status === "";

  const title = isProcessing ? "Payment processing" : "Payment successful";
  // Plan-neutral: this page is reached from Couple and Crowd checkouts, so naming a tier
  // here would be wrong for most buyers ("Premium" is a deprecated tier nobody can buy).
  const message = isProcessing
    ? "We're finalizing your subscription. This may take up to a minute — your new plan will unlock automatically once it's done."
    : "Your subscription is being activated. If it doesn't show up straight away, refresh your account or check back in a moment.";

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="max-w-xl w-full rounded-2xl border border-white/10 bg-black/30 p-8 text-center">
        <h1 className="text-3xl font-semibold text-white">{title}</h1>
        <p className="mt-3 text-white/70">{message}</p>
        <div className="mt-6 flex gap-3 justify-center">
          <Link
            href="/stream"
            className={`${appEntryActionButtonBaseClass} ${appEntryPrimaryButtonClass}`}
          >
            Go to Streaming
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