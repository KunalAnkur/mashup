"use client";

import Link from "next/link";
import { appEntryActionButtonBaseClass, appEntrySecondaryButtonClass } from "@/components/UI/classTokens";

export default function CancelPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="max-w-xl w-full rounded-2xl border border-white/10 bg-black/30 p-8 text-center">
        <h1 className="text-3xl font-semibold text-white">Checkout cancelled</h1>
        <p className="mt-3 text-white/70">
          Your payment was not completed. You can return and try upgrading again anytime.
        </p>
        <div className="mt-6 flex gap-3 justify-center">
          <Link href="/pricing" className={`${appEntryActionButtonBaseClass} ${appEntrySecondaryButtonClass}`}>
            Back to Pricing
          </Link>
        </div>
      </div>
    </div>
  );
}