"use client";

import { useEffect, useState } from "react";
import {
  isChunkLoadError,
  reloadForStaleBuild,
  reportCaughtError,
} from "@/lib/analytics/errorReporting";
import "./globals.css";

/**
 * The last line of defence: shown when the root layout itself, or something in ClientRoot
 * (the store, the socket, the providers), throws. It replaces the whole document, so it
 * renders its own <html> and <body> and can lean on nothing from the app: no translations
 * (I18nProvider is what's gone), no store, no shared components. Plain English, plain markup.
 *
 * Reporting still works: PostHog is initialised when components/PostHogProvider.tsx is first
 * imported, which happens before any of this renders.
 */
export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [isReloading, setIsReloading] = useState(false);

  useEffect(() => {
    reportCaughtError(error, "global_error_boundary");
    if (isChunkLoadError(error) && reloadForStaleBuild()) {
      setIsReloading(true);
    }
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-primaryDark text-smoothWhite antialiased">
        <main className="flex min-h-[100dvh] w-full items-center justify-center px-4 py-10">
          <div className="flex w-full max-w-md flex-col items-center gap-5 text-center">
            {isReloading ? (
              <p className="text-sm text-white/60">Updating to the latest version…</p>
            ) : (
              <>
                <h1 className="text-lg font-medium text-white/85">Something went wrong</h1>
                <p className="text-sm leading-6 text-white/55">
                  Movmash hit an unexpected problem. We&apos;ve been notified. Reloading the
                  page usually fixes it.
                </p>
                {/* A full reload, not reset(): what broke is the app shell itself, and only a
                    fresh load rebuilds it. */}
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="h-12 w-full rounded-2xl bg-gradient-to-r from-rose-600 via-pink-600 to-fuchsia-600 px-5 text-sm font-semibold text-white"
                >
                  Reload page
                </button>
                {error.digest ? (
                  <p className="text-xs text-white/35">
                    Reference: <span className="font-mono">{error.digest}</span>
                  </p>
                ) : null}
              </>
            )}
          </div>
        </main>
      </body>
    </html>
  );
}
