"use client";

import { useTranslations } from "@/i18n/I18nProvider";
import {
  dashHeroClass,
  dashHeroMobileClass,
  dashHeroPlayButtonClass,
  dashHeroCopyClass,
  dashHeroTitleClass,
  dashHeroAccentClass,
  dashHeroDescriptionClass,
} from "../UI/classTokens";

const HeroBanner = () => {
  const t = useTranslations("home");

  return (
    <div className={`${dashHeroClass} ${dashHeroMobileClass}`}>
      <div className={dashHeroPlayButtonClass}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff">
          <path d="M8 5v14l11-7z" />
        </svg>
      </div>

      <div className={dashHeroCopyClass}>
        <h1 className={dashHeroTitleClass}>
          {t("heroTitleLine1")}
          <br />
          <span className={dashHeroAccentClass}>{t("heroTitleAccent")}</span>
        </h1>
        <p className={dashHeroDescriptionClass}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="#e11d48">
            <path d="M12 21s-7.5-4.6-10-9.2C0.4 8.4 2.2 4.5 6 4c2.1-.3 3.8.9 6 3.4C14.2 4.9 15.9 3.7 18 4c3.8.5 5.6 4.4 4 7.8-2.5 4.6-10 9.2-10 9.2z" />
          </svg>
          {t("heroDescription")}
        </p>
      </div>
    </div>
  );
};

export default HeroBanner;
