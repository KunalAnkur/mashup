"use client";

import React, { useCallback, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import { appEntryActionButtonBaseClass, appEntryPrimaryButtonClass } from "@/components/UI/classTokens";
import { LuArrowRight } from "react-icons/lu";

type Props = {
  className?: string;
  label?: string;
  successUrl?: string;
  cancelUrl?: string;
};

export default function StartPremiumCheckoutButton({
  className,
  label = "Upgrade to Premium",
  successUrl = "http://localhost:3000/payment/success",
  cancelUrl = "http://localhost:3000/payment/cancel",
}: Props) {
  const token = useSelector((state: RootState) => (state as any)?.auth?.token) as string | null;
  const [loading, setLoading] = useState(false);

  const startCheckout = useCallback(async () => {
    if (!token) {
      // You can route to login or show a toast
      alert("Please login to upgrade.");
      return;
    }
    try {
      setLoading(true);
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      const resp = await fetch(`${baseUrl}/api/v1/billing/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          plan_slug: "premium",
          success_url: successUrl,
          cancel_url: cancelUrl,
        }),
      });
      const json = await resp.json();
      if (!resp.ok || !json?.success) {
        throw new Error(json?.message || "Failed to create checkout session");
      }
      const checkoutUrl: string | undefined = json?.data?.checkout_url;
      if (!checkoutUrl) throw new Error("Missing checkout_url");
      window.location.href = checkoutUrl;
    } catch (e: any) {
      alert(e?.message || "Unable to start checkout");
    } finally {
      setLoading(false);
    }
  }, [token, successUrl, cancelUrl]);

  return (
    <button
      type="button"
      onClick={startCheckout}
      disabled={loading}
      className={`${appEntryActionButtonBaseClass} ${appEntryPrimaryButtonClass} w-full ${className ?? ""}`}
    >
      <span>{loading ? "Processing..." : label}</span>
      <LuArrowRight className="text-base" />
    </button>
  );
}