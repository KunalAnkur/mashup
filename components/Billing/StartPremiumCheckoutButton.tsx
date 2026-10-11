"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
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
import { useLazyGetMySubscriptionQuery } from "@/lib/store/api/userApi";
import { setSubscription } from "@/lib/store/slices/subscriptionSlice";
import { hasActivePaidSubscription } from "@/utils/subscription";
import { useTranslations } from "@/i18n/I18nProvider";
import { trackCheckoutStarted } from "@/lib/analytics";

type Props = {
  className?: string;
  label?: string;
  /** Required: this used to default to "premium", a deprecated tier nobody can buy, so a
   *  caller that forgot it would silently start a checkout for the wrong plan. */
  planSlug: string;
  planName?: string;
  successUrl?: string;
  cancelUrl?: string;
  /**
   * Press the button on the visitor's behalf, once. Set when they arrived by a link that
   * already named this plan, so the click that brought them here is the only one they owe.
   */
  autoStart?: boolean;
  /** Called as the automatic press fires, so the caller can retire whatever asked for it. */
  onAutoStart?: () => void;
};

export default function StartPremiumCheckoutButton({
  className,
  label,
  planSlug,
  planName,
  successUrl,
  cancelUrl,
  autoStart = false,
  onAutoStart,
}: Props) {
  const router = useRouter();
  const dispatch = useDispatch();
  const [getMySubscription] = useLazyGetMySubscriptionQuery();
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
  // Signed out entirely, as opposed to browsing as a guest: same prompt, different reason.
  const isSignedOut = !authState.isAuthenticated || !authState.token;
  const autoStartedRef = useRef(false);

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
        trackCheckoutStarted(planSlug, autoStartedRef.current ? "plan_link" : "pricing_page");
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
    // Sign in here, in place, and carry straight on into checkout for the plan they picked.
    // Sending them to /login dropped the choice: they came back to the price list and had
    // to find the same button again.
    if (isSignedOut) {
      setShowGuestUpgradeModal(true);
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
    authState.token,
    authState.user,
    isSignedOut,
    resolvedLabel,
    planName,
    planSlug,
    tToast,
    startCheckout,
    subscription,
  ]);

  useEffect(() => {
    if (!autoStart || autoStartedRef.current) return;
    autoStartedRef.current = true;
    onAutoStart?.();
    void handleClick();
  }, [autoStart, handleClick, onAutoStart]);

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
        description={tGuest(isSignedOut ? "checkoutDescriptionSignedOut" : "checkoutDescription")}
        nextStepText={tGuest("checkoutNextStep")}
        onAuthenticated={async (nextToken) => {
          // The Google account they just chose may already be paying — a subscriber who was
          // signed out, or a guest attaching an account that has a plan. Sign-in does not
          // return the subscription, so look before opening a second checkout for them.
          try {
            const existing = (await getMySubscription().unwrap())?.data;
            if (existing) dispatch(setSubscription(existing));
            if (hasActivePaidSubscription(existing)) {
              showInfo(tToast("alreadySubscribed", { plan: existing.plan?.name ?? "" }));
              return;
            }
            // Their plan is on hold after a declined renewal. A new checkout would start a
            // second subscription while the first is still being retried; the fix for the
            // first one lives on the subscription page.
            if (existing?.status === SubscriptionStatus.ON_HOLD) {
              router.push("/subscription");
              return;
            }
          } catch {
            // No subscription on record reads as an error here; a new buyer carries on.
          }
          await startCheckout(nextToken);
        }}
      />
    </>
  );
}
