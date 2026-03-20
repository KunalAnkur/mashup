"use client";

import React from "react";
import { ImSpinner2 } from "react-icons/im";
import { Button } from "../../UI";
import { SectionTitle } from "../DeviceModalComponents/SectionTitle";
import { UrlInputField } from "./UrlInputField";
import { UrlCard } from "./UrlCard";
import { EmptyUrlState } from "./EmptyUrlState";
import { AddedUrl } from "@/types/ModalTypes/addedUrlTypes";
import { Platform } from "@/types/ModalTypes/urlPlatformTypes";
import { useTranslations } from "@/i18n/I18nProvider";
import {
  appSyncPrimaryButtonClass,
  appSyncSecondaryButtonClass,
  appSyncListShellEmptyClass,
  appSyncListShellClass,
} from "@/components/UI/classTokens";

interface UrlInputSectionProps {
  sourceUrlInput: string;
  onSourceUrlChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onAddUrl: () => void;
  isAddDisabled: boolean;
  tooltipMessage: string;
  addedUrls: AddedUrl[];
  loadingMetadata: Set<number>;
  onRemoveUrl: (index: number) => void;
  onCancel: () => void;
  onEnterRoom: () => void;
  getPlatformById: (id: string) => Platform | undefined;
  getUrlDisplayName: (url: string) => string;
  isAdding?: boolean;
  isEntering?: boolean;
}

export const UrlInputSection: React.FC<UrlInputSectionProps> = ({
  sourceUrlInput,
  onSourceUrlChange,
  onKeyDown,
  onAddUrl,
  isAddDisabled,
  tooltipMessage,
  addedUrls,
  loadingMetadata,
  onRemoveUrl,
  onCancel,
  onEnterRoom,
  getPlatformById,
  getUrlDisplayName,
  isAdding = false,
  isEntering = false,
}) => {
  const t = useTranslations("sync");
  const tCommon = useTranslations("common");

  const sectionHeightClass =
    addedUrls.length === 0
      ? "min-h-[200px]"
      : addedUrls.length <= 1
        ? "min-h-[220px]"
        : addedUrls.length <= 2
          ? "min-h-[290px]"
          : addedUrls.length <= 3
            ? "min-h-[360px]"
            : addedUrls.length <= 4
              ? "min-h-[430px]"
              : "min-h-[500px]";

  const listHeightClass =
    addedUrls.length <= 1
      ? "max-h-[70px]"
      : addedUrls.length <= 2
        ? "max-h-[140px]"
        : addedUrls.length <= 3
          ? "max-h-[210px]"
          : addedUrls.length <= 4
            ? "max-h-[280px]"
            : "max-h-[350px]";

  return (
    <div className="w-full flex flex-col sm:h-full sm:min-h-0">
      <SectionTitle
        gradientFrom="from-fuchsia-500"
        gradientTo="to-purple-500"
        title={t("pasteUrls")}
      />

      <div
        className={`flex flex-col gap-2.5 sm:flex-1 sm:min-h-0 sm:gap-3 md:gap-4 ${sectionHeightClass}`}
      >
        <UrlInputField
          value={sourceUrlInput}
          onChange={onSourceUrlChange}
          onKeyDown={onKeyDown}
          onAddClick={onAddUrl}
          isAddDisabled={isAddDisabled}
          tooltipMessage={tooltipMessage}
          isAdding={isAdding}
          autoFocus
        />

        <div
          className={
            addedUrls.length > 0 ? appSyncListShellClass : appSyncListShellEmptyClass
          }
        >
          {addedUrls.length > 0 ? (
            <div
              className={`flex flex-col gap-1.5 overflow-y-auto pr-1 sm:gap-2 ${listHeightClass} sm:max-h-[180px] md:max-h-[200px] lg:max-h-[215px]`}
            >
              {addedUrls.map((item, index) => (
                <UrlCard
                  key={`${item.url}-${index}`}
                  url={item}
                  index={index}
                  platform={getPlatformById(item.platformId)}
                  isLoading={loadingMetadata.has(index)}
                  onRemove={onRemoveUrl}
                  getUrlDisplayName={getUrlDisplayName}
                />
              ))}
            </div>
          ) : (
            <EmptyUrlState />
          )}
        </div>

        <div className="flex gap-2 shrink-0 sm:gap-3">
          <Button
            onClick={onCancel}
            className={appSyncSecondaryButtonClass}
            name={tCommon("cancel")}
          />
          <Button
            onClick={onEnterRoom}
            icon={isEntering ? <ImSpinner2 className="animate-spin" /> : undefined}
            className={appSyncPrimaryButtonClass}
            name={isEntering ? t("entering") : t("enterRoom")}
            disabled={addedUrls.length === 0 || isEntering}
          />
        </div>
      </div>
    </div>
  );
};
