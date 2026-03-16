"use client";

import React from "react";
import { FaVideo, FaTimes, FaCheckCircle } from "react-icons/fa";
import { useTranslations } from "@/i18n/I18nProvider";
import {
  purpleAccentIconSurfaceClass,
  zincGlassMutedBlurredSurfaceClass,
} from "@/components/UI/classTokens";

const emptyUrlPlaceholderRowClass =
  `flex items-center gap-2 sm:gap-3 ${zincGlassMutedBlurredSurfaceClass} border border-dashed border-zinc-600/20 rounded-lg sm:rounded-xl px-2.5 sm:px-3 py-2 sm:py-2.5`;
const emptyUrlPlaceholderRemoveIconWrapClass =
  "w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-zinc-700/20 flex items-center justify-center";
const emptyUrlTipRowClass =
  "flex items-start gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-white/70";
const emptyUrlTipIconClass =
  "text-green-500/60 mt-0.5 shrink-0 text-[10px] sm:text-xs";
const emptyUrlTipKeys = ["tip1", "tip2", "tip3"] as const;

export const EmptyUrlState: React.FC = () => {
  const t = useTranslations("sync");
  return (
  <div className="flex flex-col items-center justify-center h-full gap-3 sm:gap-4 py-2 sm:py-4">
    {/* Preview Placeholder Cards */}
    <div className="w-full space-y-2 mb-2 sm:mb-3">
      {[1, 2].map((i) => (
        <div
          key={i}
          className={emptyUrlPlaceholderRowClass}
        >
          <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full ${purpleAccentIconSurfaceClass} shrink-0`}>
            <FaVideo className="text-white/60 text-[10px] sm:text-xs" />
          </div>
          <div className="flex-1 h-2.5 sm:h-3 bg-zinc-700/20 rounded-full" />
          <div className={emptyUrlPlaceholderRemoveIconWrapClass}>
            <FaTimes className="text-white/40 text-[10px] sm:text-xs" />
          </div>
        </div>
      ))}
    </div>

    {/* Tips Section */}
    <div className="w-full space-y-1.5 sm:space-y-2">
      {emptyUrlTipKeys.map((tipKey) => (
        <div key={tipKey} className={emptyUrlTipRowClass}>
          <FaCheckCircle className={emptyUrlTipIconClass} />
          <span>{t(tipKey)}</span>
        </div>
      ))}
    </div>
  </div>
  );
};
