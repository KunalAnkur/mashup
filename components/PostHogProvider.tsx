"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider, usePostHog } from "posthog-js/react";
import { useEffect, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import { persistFirstTouchAttribution } from "@/lib/analytics";

// ============ INITIALIZE POSTHOG ============

if (typeof window !== "undefined") {
  const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

  if (posthogKey) {
    posthog.init(posthogKey, {
      api_host: posthogHost,
      capture_pageview: false, // Manual capture for SPA
      capture_pageleave: true,
      persistence: "localStorage",
      loaded: (ph) => {
        // Register global properties on every event
        ph.register({
          app: "movmash",
          platform: "web",
          env: process.env.NODE_ENV,
        });
        
        if (process.env.NODE_ENV === "development") {
          console.log("✅ PostHog initialized with global properties");
        }
      },
    });
  } else if (process.env.NODE_ENV === "development") {
    console.warn("⚠️ PostHog key not set. Add NEXT_PUBLIC_POSTHOG_KEY to .env.local");
  }
}

// ============ PAGE VIEW TRACKER ============

function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const ph = usePostHog();

  useEffect(() => {
    if (pathname && ph) {
      const firstTouchAttribution = persistFirstTouchAttribution();
      let url = window.origin + pathname;
      if (searchParams?.toString()) {
        url = url + `?${searchParams.toString()}`;
      }
      
      // Determine page name from pathname
      const pageName = getPageName(pathname);
      
      ph.capture("$pageview", { 
        $current_url: url,
        page: pageName,
        first_touch_source: firstTouchAttribution?.detected_source || undefined,
        first_touch_referring_domain: firstTouchAttribution?.referring_domain || undefined,
        first_touch_is_movmash_landing: firstTouchAttribution?.is_movmash_landing,
      });
      
      if (process.env.NODE_ENV === "development") {
        console.log("📊 [Analytics] $pageview", { page: pageName, url });
      }
    }
  }, [pathname, searchParams, ph]);

  return null;
}

// Helper to get page name from pathname
function getPageName(pathname: string): string {
  if (pathname === "/") return "home";
  if (pathname.startsWith("/room/")) return "room";
  if (pathname.startsWith("/stream")) return "stream";
  if (pathname.startsWith("/sync")) return "sync";
  if (pathname === "/login") return "login";
  if (pathname === "/signup") return "signup";
  return pathname.slice(1) || "unknown";
}

// ============ USER IDENTIFICATION ============

function PostHogUserIdentify() {
  const ph = usePostHog();
  const user = useSelector((state: RootState) => state.auth.user);

  useEffect(() => {
    if (user?.id && ph) {
      ph.identify(user.id, {
        email: user.email,
        name: user.name,
      });
      
      if (process.env.NODE_ENV === "development") {
        console.log("📊 [Analytics] User identified:", user.id);
      }
    } else if (!user && ph) {
      ph.reset();
    }
  }, [user, ph]);

  return null;
}

// ============ PROVIDER COMPONENT ============

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;

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

// Export posthog instance for direct access if needed
export { posthog };
