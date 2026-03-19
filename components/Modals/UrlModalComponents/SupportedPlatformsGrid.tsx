"use client";

import React from "react";
import { platforms } from "@/constants/urlPlatforms";
import { SectionTitle } from "../DeviceModalComponents/SectionTitle";
import { useTranslations } from "@/i18n/I18nProvider";
import {
  appSyncPlatformCardClass,
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
    <div className={appSyncPlatformIconClass}>{platform.icon}</div>
    <span className={appSyncPlatformLabelClass}>{platform.name}</span>
  </div>
);

export const SupportedPlatformsGrid: React.FC = () => {
  const t = useTranslations("sync");
  return (
    <div className="w-full flex flex-col h-full">
      <SectionTitle
        gradientFrom="from-rose-500"
        gradientTo="to-pink-500"
        title={t("supportedPlatforms")}
      />
      <div className="flex-1 min-h-0">
        <div className="grid h-full grid-cols-3 gap-2 md:gap-3 lg:gap-4">
          {platforms.map((platform) => (
            <PlatformCard key={platform.id} platform={platform} />
          ))}
        </div>
      </div>
    </div>
  );
};
