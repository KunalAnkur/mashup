"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider, usePostHog } from "posthog-js/react";
import { useEffect, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store";

// Initialize PostHog
if (typeof window !== "undefined") {
  const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

  if (posthogKey) {
    posthog.init(posthogKey, {
      api_host: posthogHost,
      capture_pageview: false, // We capture manually for SPA navigation
      capture_pageleave: true,
      persistence: "localStorage",
      loaded: (posthog) => {
        if (process.env.NODE_ENV === "development") {
          console.log("✅ PostHog loaded successfully!");
        }
      },
    });
  } else if (process.env.NODE_ENV === "development") {
    console.warn("⚠️ PostHog key not set. Add NEXT_PUBLIC_POSTHOG_KEY to .env.local");
  }
}

// Page view tracker component
function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const posthogClient = usePostHog();

  useEffect(() => {
    if (pathname && posthogClient) {
      let url = window.origin + pathname;
      if (searchParams?.toString()) {
        url = url + `?${searchParams.toString()}`;
      }
      posthogClient.capture("$pageview", { $current_url: url });
      
      if (process.env.NODE_ENV === "development") {
        console.log("📊 PostHog pageview:", pathname);
      }
    }
  }, [pathname, searchParams, posthogClient]);

  return null;
}

// User identification component
function PostHogUserIdentify() {
  const posthogClient = usePostHog();
  const user = useSelector((state: RootState) => state.auth.user);

  useEffect(() => {
    if (user?.id && posthogClient) {
      posthogClient.identify(user.id, {
        email: user.email,
        name: user.name,
      });
    } else if (!user && posthogClient) {
      posthogClient.reset();
    }
  }, [user, posthogClient]);

  return null;
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;

  // If no key, just render children without PostHog
  if (!posthogKey) {
    return <>{children}</>;
  }

  return (
    <PHProvider client={posthog}>
      <Suspense fallback={null}>
        <PostHogPageView />
      </Suspense>
      <PostHogUserIdentify />
      {children}
    </PHProvider>
  );
}

// Export posthog instance for manual event tracking
export { posthog };

// ============ TRACKING HELPERS ============

type AuthMethod = "google" | "google_one_tap" | "guest" | "email";

/** Track when a user signs up */
export const trackSignup = (method: AuthMethod, additionalProps?: Record<string, any>) => {
  posthog.capture("user_signed_up", {
    method,
    ...additionalProps,
  });
  if (process.env.NODE_ENV === "development") {
    console.log("📊 PostHog: user_signed_up", { method, ...additionalProps });
  }
};

/** Track when a user logs in */
export const trackLogin = (method: AuthMethod, additionalProps?: Record<string, any>) => {
  posthog.capture("user_logged_in", {
    method,
    ...additionalProps,
  });
  if (process.env.NODE_ENV === "development") {
    console.log("📊 PostHog: user_logged_in", { method, ...additionalProps });
  }
};

/** Track room creation */
export const trackRoomCreated = (roomType: "stream" | "sync", source: "file" | "url" | "screen") => {
  posthog.capture("room_created", {
    room_type: roomType,
    source,
  });
  if (process.env.NODE_ENV === "development") {
    console.log("📊 PostHog: room_created", { roomType, source });
  }
};

/** Track room joined */
export const trackRoomJoined = (isHost: boolean) => {
  posthog.capture("room_joined", {
    is_host: isHost,
  });
  if (process.env.NODE_ENV === "development") {
    console.log("📊 PostHog: room_joined", { isHost });
  }
};
