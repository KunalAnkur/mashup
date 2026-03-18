"use client";

import React from "react";
import { Button, Input } from "../../UI";
import { ImSpinner2 } from "react-icons/im";
import { useTranslations } from "@/i18n/I18nProvider";
import {
  appInputRadiusClass,
  appInputVerticalPaddingClass,
  movmashGradientStopsClass,
} from "@/components/UI/classTokens";

interface UrlInputFieldProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onAddClick: () => void;
  isAddDisabled: boolean;
  tooltipMessage: string;
  isAdding?: boolean;
}

export const UrlInputField: React.FC<UrlInputFieldProps> = ({
  value,
  onChange,
  onKeyDown,
  onAddClick,
  isAddDisabled,
  tooltipMessage,
  isAdding = false,
}) => {
  const t = useTranslations("sync");
  return (
    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
      <Input
        variant="raw"
        type="text"
        placeholder={t("enterUrl")}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        className={`flex-1 min-w-0 ${appInputRadiusClass} bg-black/10 backdrop-blur-2xl border border-zinc-600/10 text-white text-base px-3 sm:px-4 ${appInputVerticalPaddingClass} focus:outline-none transition-all duration-200 placeholder:text-white/40`}
        disabled={isAdding}
      />
      <div className="relative group shrink-0">
        <Button
          onClick={onAddClick}
          icon={isAdding ? <ImSpinner2 className="animate-spin" /> : undefined}
          className={`w-full sm:w-auto bg-gradient-to-r ${movmashGradientStopsClass} text-white font-semibold text-xs sm:text-sm px-4 sm:px-5 py-2 sm:py-3 rounded-xl transition-all duration-200 shadow-lg shadow-pink-500/20 hover:shadow-pink-500/30 disabled:bg-zinc-700/50 disabled:text-gray-400 disabled:cursor-not-allowed disabled:opacity-50`}
          name={isAdding ? t("loading") : t("addUrl")}
          disabled={isAddDisabled || isAdding}
        />
        {isAddDisabled && tooltipMessage && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-[#2a2a2e] text-gray-200 text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-10 shadow-xl">
            {tooltipMessage}
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-[#2a2a2e]" />
          </div>
        )}
      </div>
    </div>
  );
};
