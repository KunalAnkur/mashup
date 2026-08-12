"use client";

import React from "react";
import { platforms } from "@/constants/urlPlatforms";
import { SectionTitle } from "../DeviceModalComponents/SectionTitle";
import { useTranslations } from "@/i18n/I18nProvider";
import {
  appSyncPlatformCardClass,
  appSyncPlatformCardOverlayClass,
  appSyncPlatformIconClass,
  appSyncPlatformLabelClass,
} from "@/components/UI/classTokens";

interface PlatformCardProps {
  platform: (typeof platforms)[0];
}

const PlatformCard: React.FC<PlatformCardProps> = ({ platform }) => (
  <div
    style={platform.bgStyle}
    className={appSyncPlatformCardClass}
  >
    <div className={appSyncPlatformCardOverlayClass} />
    <div className="relative z-10 flex flex-col items-center">
      <div className={appSyncPlatformIconClass}>{platform.icon}</div>
      <span className={appSyncPlatformLabelClass}>{platform.name}</span>
    </div>
  </div>
);

export const SupportedPlatformsGrid: React.FC = () => {
  const t = useTranslations("sync");
  return (
    <div className="w-full flex flex-col">
      <SectionTitle
        gradientFrom="from-rose-500"
        gradientTo="to-pink-500"
        title={t("supportedPlatforms")}
      />
      {/* Single horizontal row of compact tiles instead of a 3x2 grid — now its own
          standalone box below the URL panel, not a height-matched side column. */}
      <div className="grid w-full grid-cols-6 gap-1.5 md:gap-2">
        {platforms.map((platform) => (
          <PlatformCard key={platform.id} platform={platform} />
        ))}
      </div>
    </div>
  );
};
