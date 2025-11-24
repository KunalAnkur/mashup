import React from "react";
import { Button } from "../../UI";
import { SectionTitle } from "../DeviceModalComponents/SectionTitle";
import { UrlInputField } from "./UrlInputField";
import { UrlCard } from "./UrlCard";
import { EmptyUrlState } from "./EmptyUrlState";
import { AddedUrl } from "@/types/ModalTypes/addedUrlTypes";
import { Platform } from "@/types/ModalTypes/urlPlatformTypes";

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
}) => (
  <div className="w-full lg:w-1/2 flex flex-col">
    <SectionTitle
      gradientFrom="from-fuchsia-500"
      gradientTo="to-purple-500"
      title="Paste Your URLs"
    />

    <div className="bg-gradient-to-br from-[#1f1f23] to-[#27272a] rounded-2xl p-4 shadow-xl flex flex-col flex-1">
      <div className="flex flex-col h-full gap-3">
        {/* URL Input Field */}
        <UrlInputField
          value={sourceUrlInput}
          onChange={onSourceUrlChange}
          onKeyDown={onKeyDown}
          onAddClick={onAddUrl}
          isAddDisabled={isAddDisabled}
          tooltipMessage={tooltipMessage}
        />

        {/* Added URLs List or Empty State */}
        <div className="flex-1 min-h-0 max-h-full overflow-hidden">
          {addedUrls.length > 0 ? (
            <div className="flex flex-col gap-2 pr-1 overflow-y-auto max-h-[230px]">
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

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={onCancel}
            className="flex-1 rounded-xl flex items-center justify-center bg-white/5 text-gray-300 text-sm px-4 py-3 hover:bg-white/10 hover:text-white transition-all duration-200 font-medium"
            name="Cancel"
          />
          <Button
            onClick={onEnterRoom}
            className="flex-1 bg-gradient-to-r from-rose-600 via-pink-600 to-fuchsia-600 hover:from-rose-500 hover:via-pink-500 hover:to-fuchsia-500 text-white font-semibold text-sm px-6 py-3 rounded-xl transition-all duration-200 shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 disabled:bg-white/5 disabled:text-gray-600 disabled:cursor-not-allowed disabled:bg-none disabled:shadow-none"
            name="Enter"
            disabled={addedUrls.length === 0}
          />
        </div>
      </div>
    </div>
  </div>
);
