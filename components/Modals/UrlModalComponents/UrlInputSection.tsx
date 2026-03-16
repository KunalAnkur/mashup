"use client";

import React from "react";
import { Button } from "../../UI";
import { SectionTitle } from "../DeviceModalComponents/SectionTitle";
import { UrlInputField } from "./UrlInputField";
import { UrlCard } from "./UrlCard";
import { EmptyUrlState } from "./EmptyUrlState";
import { AddedUrl } from "@/types/ModalTypes/addedUrlTypes";
import { Platform } from "@/types/ModalTypes/urlPlatformTypes";
import { ImSpinner2 } from "react-icons/im";
import { useTranslations } from "@/i18n/I18nProvider";
import {
  movmashElevatedShadowClass,
  movmashGradientStopsClass,
  zincGlassLgPanelSurfaceClass,
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
  return (
  <div className="w-full flex flex-col sm:h-full sm:min-h-0">
    <SectionTitle
      gradientFrom="from-fuchsia-500"
      gradientTo="to-purple-500"
      title={t("pasteUrls")}
    />

    <div className={`${zincGlassLgPanelSurfaceClass} p-3 sm:p-4 md:p-5 flex flex-col sm:flex-1 sm:min-h-0 transition-all duration-300
      ${addedUrls.length === 0 ? 'min-h-[200px]' : 
        addedUrls.length <= 1 ? 'min-h-[220px]' : 
        addedUrls.length <= 2 ? 'min-h-[290px]' : 
        addedUrls.length <= 3 ? 'min-h-[360px]' : 
        addedUrls.length <= 4 ? 'min-h-[430px]' : 'min-h-[500px]'}
      sm:min-h-0
    `}>
      <div className="flex flex-col gap-2.5 sm:gap-3 md:gap-4 sm:h-full sm:min-h-0">
        {/* URL Input Field */}
        <UrlInputField
          value={sourceUrlInput}
          onChange={onSourceUrlChange}
          onKeyDown={onKeyDown}
          onAddClick={onAddUrl}
          isAddDisabled={isAddDisabled}
          tooltipMessage={tooltipMessage}
          isAdding={isAdding}
        />

        {/* Added URLs List or Empty State - Mobile grows based on URL count */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {addedUrls.length > 0 ? (
            <div 
              className={`flex flex-col gap-1.5 sm:gap-2 pr-1 overflow-y-auto
                ${addedUrls.length <= 1 ? 'max-h-[70px]' : 
                  addedUrls.length <= 2 ? 'max-h-[140px]' : 
                  addedUrls.length <= 3 ? 'max-h-[210px]' : 
                  addedUrls.length <= 4 ? 'max-h-[280px]' : 'max-h-[350px]'}
                sm:max-h-[180px] md:max-h-[200px] lg:max-h-[215px]
              `}
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
          ) :
            (<EmptyUrlState />)
          }
        </div>

        {/* Action Buttons */}
        <div className="flex  gap-2 sm:gap-3 shrink-0">
          <Button
            onClick={onCancel}
            className="flex-1 rounded-lg md:rounded-xl flex items-center justify-center gap-2 bg-gradient-to-br from-zinc-800/15 via-zinc-700/15 to-zinc-800/15 backdrop-blur-2xl hover:from-purple-600/20 hover:via-pink-600/20 hover:to-fuchsia-600/20 hover:border-purple-500/30 border border-zinc-600/15 text-white text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 transition-all duration-200 font-medium"
            name={tCommon("cancel")}
          />
          <Button
            onClick={onEnterRoom}
            icon={isEntering ? <ImSpinner2 className="animate-spin" /> : undefined}
            className={`flex-1 bg-gradient-to-r ${movmashGradientStopsClass} ${movmashElevatedShadowClass} text-white font-semibold text-xs sm:text-sm px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-lg md:rounded-xl transition-all duration-200 disabled:bg-zinc-700/50 disabled:text-gray-400 disabled:cursor-not-allowed disabled:opacity-50`}
            name={isEntering ? t("entering") : t("enterRoom")}
            disabled={addedUrls.length === 0 || isEntering}
          />
        </div>
      </div>
    </div>
  </div>
  );
};
