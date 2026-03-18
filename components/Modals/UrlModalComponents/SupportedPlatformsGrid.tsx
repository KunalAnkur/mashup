"use client";

import React from "react";
import { platforms } from "@/constants/urlPlatforms";
import { SectionTitle } from "../DeviceModalComponents/SectionTitle";
import { useTranslations } from "@/i18n/I18nProvider";
import { zincGlassLgPanelSurfaceClass } from "@/components/UI/classTokens";

interface PlatformCardProps {
  platform: (typeof platforms)[0];
}

const PlatformCard: React.FC<PlatformCardProps> = ({ platform }) => (
  <div
    style={platform.bgStyle}
    className="aspect-square flex flex-col items-center justify-center rounded-lg md:rounded-xl lg:rounded-2xl shadow-lg p-2 md:p-3 lg:p-4 xl:p-5 2xl:p-6 transition-all duration-300 hover:scale-105 hover:shadow-xl group cursor-pointer min-h-[70px] md:min-h-[90px] lg:min-h-[110px] xl:min-h-[130px] 2xl:min-h-[140px]"
  >
    <div className="text-white group-hover:scale-110 transition-transform duration-300 text-lg md:text-xl lg:text-2xl xl:text-3xl 2xl:text-4xl">
      {platform.icon}
    </div>
    <span className="text-[10px] md:text-xs lg:text-sm xl:text-base font-bold text-white mt-1 md:mt-2 lg:mt-3 text-center leading-tight px-1">
      {platform.name}
    </span>
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
    <div className={`${zincGlassLgPanelSurfaceClass} p-3 md:p-4 lg:p-5 flex-1 min-h-0`}>
      <div className="grid grid-cols-3 gap-2 md:gap-3 lg:gap-4 h-full">
        {platforms.map((platform) => (
          <PlatformCard key={platform.id} platform={platform} />
        ))}
      </div>
    </div>
  </div>
  );
};
