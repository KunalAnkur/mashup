"use client";

import React from "react";
import { ImSpinner2 } from "react-icons/im";
import { Button, Input } from "../../UI";
import { useTranslations } from "@/i18n/I18nProvider";
import {
  appSyncFieldInputClass,
  appSyncPrimaryButtonClass,
  appSyncTooltipSurfaceClass,
} from "@/components/UI/classTokens";

interface UrlInputFieldProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onAddClick: () => void;
  isAddDisabled: boolean;
  tooltipMessage: string;
  isAdding?: boolean;
  autoFocus?: boolean;
}

export const UrlInputField: React.FC<UrlInputFieldProps> = ({
  value,
  onChange,
  onKeyDown,
  onAddClick,
  isAddDisabled,
  tooltipMessage,
  isAdding = false,
  autoFocus = false,
}) => {
  const t = useTranslations("sync");

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
      <Input
        variant="raw"
        type="text"
        autoFocus={autoFocus}
        placeholder={t("enterUrl")}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        className={`${appSyncFieldInputClass} focus:outline-none`}
        disabled={isAdding}
      />

      <div className="relative group shrink-0">
        <Button
          onClick={onAddClick}
          icon={isAdding ? <ImSpinner2 className="animate-spin" /> : undefined}
          className={`w-full sm:w-auto ${appSyncPrimaryButtonClass}`}
          name={isAdding ? t("loading") : t("addUrl")}
          disabled={isAddDisabled || isAdding}
        />

        {isAddDisabled && tooltipMessage ? (
          <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <div className={appSyncTooltipSurfaceClass}>
              {tooltipMessage}
            </div>
            <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-[#18181f]" />
          </div>
        ) : null}
      </div>
    </div>
  );
};
