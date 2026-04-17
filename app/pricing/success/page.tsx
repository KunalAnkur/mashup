"use client";

import Link from "next/link";
import {
  appEntryActionButtonBaseClass,
  appEntryPrimaryButtonClass,
  appEntrySecondaryButtonClass,
} from "@/components/UI/classTokens";

export default function SuccessPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="max-w-xl w-full rounded-2xl border border-white/10 bg-black/30 p-8 text-center">
        <h1 className="text-3xl font-semibold text-white">Payment successful</h1>
        <p className="mt-3 text-white/70">
          Your Premium subscription is being activated. If it doesn't reflect immediately, refresh your account or revisit in a moment.
        </p>
        <div className="mt-6 flex gap-3 justify-center">
          <Link href="/stream" className={`${appEntryActionButtonBaseClass} ${appEntryPrimaryButtonClass}`}>
            Go to Streaming
          </Link>
          <Link href="/" className={`${appEntryActionButtonBaseClass} ${appEntrySecondaryButtonClass}`}>
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}