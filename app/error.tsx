"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LuHouse, LuRotateCw } from "react-icons/lu";
import { useTranslations } from "@/i18n/I18nProvider";
import {
  isChunkLoadError,
  reloadForStaleBuild,
  reportCaughtError,
} from "@/lib/analytics/errorReporting";
import {
  appEntryActionButtonBaseClass,
  appEntryPrimaryButtonClass,
  appEntrySecondaryButtonClass,
  appErrorPageWrapClass,
  appNotFoundActionRowClass,
  appNotFoundBodyClass,
  appNotFoundContentClass,
  appNotFoundLeadClass,
} from "@/components/UI/classTokens";

/**
 * Shown in place of any page that throws while rendering. Without this file a single bad
 * render took down the whole app with Next's bare "Application error" screen.
 *
 * It sits inside the root layout, so translations and the store still work here. It does
 * not reuse DashboardShell: if the sidebar is what crashed, rendering it again would crash
 * this page too, and the user would fall through to global-error.tsx.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("errorPage");
  const [isReloading, setIsReloading] = useState(false);

  useEffect(() => {
    reportCaughtError(error, "error_boundary");
    if (isChunkLoadError(error) && reloadForStaleBuild()) {
      setIsReloading(true);
    }
  }, [error]);

  if (isReloading) {
    return (
      <div className={appErrorPageWrapClass}>
        <p className={appNotFoundBodyClass}>{t("updating")}</p>
      </div>
    );
  }

  return (
    <div className={appErrorPageWrapClass}>
      <div className={appNotFoundContentClass}>
        <div className="flex flex-col items-center gap-2 sm:gap-3">
          <h1 className={appNotFoundLeadClass}>{t("title")}</h1>
          <p className={appNotFoundBodyClass}>{t("description")}</p>
        </div>

        <div className={appNotFoundActionRowClass}>
          <button
            type="button"
            onClick={reset}
            className={`${appEntryActionButtonBaseClass} ${appEntryPrimaryButtonClass} w-full sm:flex-1`}
          >
            <LuRotateCw className="text-base" />
            <span>{t("tryAgain")}</span>
          </button>
          <Link
            href="/"
            className={`${appEntryActionButtonBaseClass} ${appEntrySecondaryButtonClass} w-full sm:flex-1`}
          >
            <LuHouse className="text-base" />
            <span>{t("goHome")}</span>
          </Link>
        </div>

        {error.digest ? (
          <p className="text-xs text-white/35">
            {t("reference")} <span className="font-mono">{error.digest}</span>
          </p>
        ) : null}
      </div>
    </div>
  );
}
