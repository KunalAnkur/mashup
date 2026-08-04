"use client";

import React, { useCallback, useState } from "react";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { RootState } from "@/lib/store";
import GuestSignInModal from "@/components/Billing/GuestSignInModal";
import {
  appEntryActionButtonBaseClass,
  appEntryPrimaryButtonClass,
} from "@/components/UI/classTokens";
import { LuArrowRight } from "react-icons/lu";
import { showError, showInfo } from "@/utils/toast";
import { SubscriptionStatus } from "@/types/subscriptionTypes";
import { useTranslations } from "@/i18n/I18nProvider";

type Props = {
  className?: string;
  label?: string;
  /** Required: this used to default to "premium", a deprecated tier nobody can buy, so a
   *  caller that forgot it would silently start a checkout for the wrong plan. */
  planSlug: string;
  planName?: string;
  successUrl?: string;
  cancelUrl?: string;
};

export default function StartPremiumCheckoutButton({
  className,
  label,
  planSlug,
  planName,
  successUrl,
  cancelUrl,
}: Props) {
  const router = useRouter();
  const tCommon = useTranslations("common");
  const tToast = useTranslations("toast");
  const tGuest = useTranslations("auth.guestSignIn");
  const resolvedLabel = label ?? tCommon("upgradePlan");
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
            plan_slug: planSlug,
            success_url: resolveCallbackUrl("/pricing/success", successUrl),
            cancel_url: resolveCallbackUrl("/pricing/failure", cancelUrl),
          }),
        });
        const json = await resp.json();
        if (!resp.ok || !json?.success) {
          throw new Error(json?.message || tToast("checkoutSessionFailed"));
        }
        const checkoutUrl: string | undefined = json?.data?.checkout_url;
        if (!checkoutUrl) throw new Error(tToast("checkoutUrlMissing"));
        window.location.href = checkoutUrl;
      } catch (error: any) {
        showError(
          tToast("checkoutStartFailed"),
          error?.message || tToast("tryAgain"),
        );
      } finally {
        setLoading(false);
      }
    },
    [authState.token, cancelUrl, planSlug, resolveCallbackUrl, router, successUrl, tToast],
  );

  const handleClick = useCallback(async () => {
    if (!authState.isAuthenticated || !authState.token) {
      router.push(`/login?redirect=${encodeURIComponent("/pricing")}`);
      return;
    }

    const isSamePlan =
      subscription?.plan?.slug === planSlug &&
      subscription.status !== SubscriptionStatus.EXPIRED;

    if (isSamePlan) {
      showInfo(
        tToast(
          subscription?.status === SubscriptionStatus.CANCELLED
            ? "alreadySubscribedCancelled"
            : "alreadySubscribed",
          { plan: planName ?? resolvedLabel },
        ),
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
    resolvedLabel,
    planName,
    planSlug,
    tToast,
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
        <span>{loading ? tCommon("processing") : resolvedLabel}</span>
        <LuArrowRight className="text-base" />
      </button>

      <GuestSignInModal
        open={showGuestUpgradeModal}
        onClose={() => setShowGuestUpgradeModal(false)}
        title={tGuest("checkoutTitle")}
        description={tGuest("checkoutDescription")}
        nextStepText={tGuest("checkoutNextStep")}
        onAuthenticated={async (nextToken) => {
          await startCheckout(nextToken);
        }}
      />
    </>
  );
}
