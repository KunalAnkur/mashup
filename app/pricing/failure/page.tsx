"use client";

import Link from "next/link";
import {
  appEntryActionButtonBaseClass,
  appEntryPrimaryButtonClass,
  appEntrySecondaryButtonClass,
} from "@/components/UI/classTokens";

export default function FailurePage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="max-w-xl w-full rounded-2xl border border-white/10 bg-black/30 p-8 text-center">
        <h1 className="text-3xl font-semibold text-white">Payment failed</h1>
        <p className="mt-3 text-white/70">
          Your payment couldn't be completed. No charges were made. You can try again anytime.
        </p>
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