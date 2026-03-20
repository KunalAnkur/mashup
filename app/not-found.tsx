"use client";

import Link from "next/link";
import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LuArrowLeft, LuHouse } from "react-icons/lu";
import { EntryPageHeader } from "@/components/UI";
import { useTranslations } from "@/i18n/I18nProvider";
import {
  appEntryActionButtonBaseClass,
  appEntryPageContentWrapClass,
  appEntryPageFixedHeaderOffsetClass,
  appEntryPageInsetClass,
  appEntryPageShellClass,
  appEntryPrimaryButtonClass,
  appEntrySecondaryButtonClass,
  appFixedViewportPageClass,
  appNotFoundActionRowClass,
  appNotFoundBodyClass,
  appNotFoundCodeClass,
  appNotFoundContentClass,
  appNotFoundFootnoteClass,
  appNotFoundLeadClass,
} from "@/components/UI/classTokens";

const NotFound = () => {
  const router = useRouter();
  const t = useTranslations("notFound");

  useEffect(() => {
    router.prefetch("/");
  }, [router]);

  const handleGoBack = useCallback(() => {
    const currentUrl = window.location.href;
    router.back();

    window.setTimeout(() => {
      if (window.location.href === currentUrl) {
        router.replace("/");
      }
    }, 180);
  }, [router]);

  return (
    <div className={appFixedViewportPageClass}>
      <div className={appEntryPageShellClass}>
        <EntryPageHeader fixed />

        <div
          className={`flex-1 min-h-0 overflow-y-auto overflow-x-hidden ${appEntryPageFixedHeaderOffsetClass}`}
        >
          <div className={appEntryPageInsetClass}>
            <div className={appEntryPageContentWrapClass}>
              <div className="flex min-h-[calc(100vh-8.5rem)] items-center justify-center sm:min-h-[calc(100vh-9rem)]">
                <div className={appNotFoundContentClass}>
                  <h1 className={appNotFoundCodeClass}>404</h1>

                  <div className="flex flex-col items-center gap-2 sm:gap-3">
                    <p className={appNotFoundLeadClass}>{t("title")}</p>
                    <p className={appNotFoundBodyClass}>{t("description1")}</p>
                    <p className={appNotFoundBodyClass}>{t("description2")}</p>
                  </div>

                  <div className={appNotFoundActionRowClass}>
                    <Link
                      href="/"
                      prefetch
                      className={`${appEntryActionButtonBaseClass} ${appEntryPrimaryButtonClass} w-full sm:flex-1`}
                    >
                      <LuHouse className="text-base" />
                      <span>{t("goHome")}</span>
                    </Link>

                    <button
                      type="button"
                      onClick={handleGoBack}
                      className={`${appEntryActionButtonBaseClass} ${appEntrySecondaryButtonClass} w-full sm:flex-1`}
                    >
                      <LuArrowLeft className="text-base" />
                      <span>{t("goBack")}</span>
                    </button>
                  </div>

                  <p className={appNotFoundFootnoteClass}>
                    <span className="font-medium text-white/60">{t("funFact")}</span>{" "}
                    {t("funFactText")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
