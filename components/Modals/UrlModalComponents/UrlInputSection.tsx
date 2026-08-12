"use client";

import React from "react";
import { ImSpinner2 } from "react-icons/im";
import { Button } from "../../UI";
import { UrlInputField } from "./UrlInputField";
import { UrlCard } from "./UrlCard";
import { EmptyUrlState } from "./EmptyUrlState";
import { AddedUrl } from "@/types/ModalTypes/addedUrlTypes";
import { Platform } from "@/types/ModalTypes/urlPlatformTypes";
import { useTranslations } from "@/i18n/I18nProvider";
import {
  appSyncPrimaryButtonClass,
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
  onEnterRoom,
  getPlatformById,
  getUrlDisplayName,
  isAdding = false,
  isEntering = false,
}) => {
  const t = useTranslations("sync");

  return (
    <div className="w-full flex flex-col">
      {/* No "Paste Your URLs" heading here on purpose — the page's own <h1> already says
          "Enter Source URL", a second heading right under it was redundant. */}
      <div className="flex flex-col gap-2.5 sm:gap-3 md:gap-4">
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
            <div className="flex h-full flex-col gap-1.5 overflow-y-auto pr-1 sm:gap-2">
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
            onClick={onEnterRoom}
            icon={isEntering ? <ImSpinner2 className="animate-spin" /> : undefined}
            className={`w-full justify-center ${appSyncPrimaryButtonClass}`}
            name={isEntering ? t("entering") : t("enterRoom")}
            disabled={addedUrls.length === 0 || isEntering}
          />
        </div>
      </div>
    </div>
  );
};
