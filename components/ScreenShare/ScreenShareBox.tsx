"use client";

import React from "react";
import { SectionTitle } from "../Modals/DeviceModalComponents/SectionTitle";
import { FaDesktop } from "react-icons/fa";
import { useTranslations } from "@/i18n/I18nProvider";
import {
  appStreamScreenShareButtonClass,
  appStreamScreenShareIconClass,
} from "@/components/UI/classTokens";

interface ScreenShareBoxProps {
  handleScreenShareClick: () => void;
}

export const ScreenShareBox: React.FC<ScreenShareBoxProps> = ({
  handleScreenShareClick,
}) => {
  const t = useTranslations("stream");
  return (
  <div className="flex flex-col w-full h-full">
    <SectionTitle
      gradientFrom="from-fuchsia-500"
      gradientTo="to-purple-500"
      title={t("screenShare")}
    />
    <div className="flex flex-1 flex-col gap-3 sm:gap-4">
      <button
        onClick={handleScreenShareClick}
        className={`${appStreamScreenShareButtonClass} min-h-[140px] sm:min-h-[180px]`}
      >
        <div className="flex h-full w-full flex-col items-center justify-center">
          <div className={appStreamScreenShareIconClass}>
            <FaDesktop className="h-8 w-8 sm:h-10 sm:w-10" />
          </div>
          <span className="text-base font-semibold tracking-tight text-white/90 sm:text-lg md:text-xl">
            {t("screenShare")}
          </span>
        </div>
      </button>
    </div>
  </div>
  );
};
