"use client";

import React, { useCallback, useState } from "react";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { RootState } from "@/lib/store";
import GuestPremiumUpgradeModal from "@/components/Billing/GuestPremiumUpgradeModal";
import {
  appEntryActionButtonBaseClass,
  appEntryPrimaryButtonClass,
} from "@/components/UI/classTokens";
import { LuArrowRight } from "react-icons/lu";
import { showError, showInfo } from "@/utils/toast";
import {
  SubscriptionStatus,
  SubscriptionTier,
} from "@/types/subscriptionTypes";

type Props = {
  className?: string;
  label?: string;
  successUrl?: string;
  cancelUrl?: string;
};

export default function StartPremiumCheckoutButton({
  className,
  label = "Upgrade to Premium",
  successUrl,
  cancelUrl,
}: Props) {
  const router = useRouter();
  const authState = useSelector((state: RootState) => state.auth);
  const subscription = useSelector(
    (state: RootState) => state.subscription.subscription,
  );
  const [loading, setLoading] = useState(false);
  const [showGuestUpgradeModal, setShowGuestUpgradeModal] = useState(false);

  const resolveCallbackUrl = useCallback(
    (fallbackPath: string, override?: string) => {
      if (override) {
        return override;
      }

      if (typeof window !== "undefined") {
        return new URL(fallbackPath, window.location.origin).toString();
      }

      return fallbackPath;
    },
    [],
  );

  const startCheckout = useCallback(
    async (tokenOverride?: string | null) => {
      const token = tokenOverride ?? authState.token;

      if (!token) {
        router.push(`/login?redirect=${encodeURIComponent("/pricing")}`);
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
            success_url: resolveCallbackUrl("/pricing/success", successUrl),
            cancel_url: resolveCallbackUrl("/pricing/failure", cancelUrl),
          }),
        });
        const json = await resp.json();
        if (!resp.ok || !json?.success) {
          throw new Error(json?.message || "Failed to create checkout session");
        }
        const checkoutUrl: string | undefined = json?.data?.checkout_url;
        if (!checkoutUrl) throw new Error("Missing checkout_url");
        window.location.href = checkoutUrl;
      } catch (error: any) {
        showError(
          "Unable to start checkout",
          error?.message || "Please try again.",
        );
      } finally {
        setLoading(false);
      }
    },
    [authState.token, cancelUrl, resolveCallbackUrl, router, successUrl],
  );

  const handleClick = useCallback(async () => {
    if (!authState.isAuthenticated || !authState.token) {
      router.push(`/login?redirect=${encodeURIComponent("/pricing")}`);
      return;
    }

    const isPremiumUser =
      subscription?.tier === SubscriptionTier.PREMIUM &&
      subscription.status !== SubscriptionStatus.EXPIRED;

    if (isPremiumUser) {
      showInfo(
        subscription?.status === SubscriptionStatus.CANCELLED
          ? "Your Premium plan is already active and set to end at the close of the current billing period."
          : "You are already enrolled in this plan.",
      );
      return;
    }

    if (authState.user?.isGuestUser) {
      setShowGuestUpgradeModal(true);
      return;
    }

    await startCheckout(authState.token);
  }, [
    authState.isAuthenticated,
    authState.token,
    authState.user,
    router,
    startCheckout,
    subscription,
  ]);

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className={`${appEntryActionButtonBaseClass} ${appEntryPrimaryButtonClass} w-full ${className ?? ""}`}
      >
        <span>{loading ? "Processing..." : label}</span>
        <LuArrowRight className="text-base" />
      </button>

      <GuestPremiumUpgradeModal
        open={showGuestUpgradeModal}
        onClose={() => setShowGuestUpgradeModal(false)}
        onAuthenticated={async (nextToken) => {
          await startCheckout(nextToken);
        }}
      />
    </>
  );
}
