import React from "react";
import { Button } from "../../UI";
import { SectionTitle } from "../DeviceModalComponents/SectionTitle";
import { UrlInputField } from "./UrlInputField";
import { UrlCard } from "./UrlCard";
import { EmptyUrlState } from "./EmptyUrlState";
import { AddedUrl } from "@/types/ModalTypes/addedUrlTypes";
import { Platform } from "@/types/ModalTypes/urlPlatformTypes";
import { ImSpinner2 } from "react-icons/im";

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
}) => (
  <div className="w-full lg:w-1/2 flex flex-col">
    <SectionTitle
      gradientFrom="from-fuchsia-500"
      gradientTo="to-purple-500"
      title="Paste Your URLs"
    />

    <div className="bg-gradient-to-br from-zinc-800/15 via-zinc-700/15 to-zinc-800/15 backdrop-blur-lg border border-zinc-600/15 rounded-2xl p-5 flex flex-col flex-1">
      <div className="flex flex-col h-full gap-3">
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
            className="flex-1 rounded-xl flex items-center justify-center gap-2 bg-gradient-to-br from-zinc-800/15 via-zinc-700/15 to-zinc-800/15 backdrop-blur-2xl hover:from-purple-600/20 hover:via-pink-600/20 hover:to-fuchsia-600/20 hover:border-purple-500/30 border border-zinc-600/15 text-white text-sm px-4 py-3 transition-all duration-200 font-medium"
            name="Cancel"
          />
          <Button
            onClick={onEnterRoom}
            icon={isEntering ? <ImSpinner2 className="animate-spin" /> : undefined}
            className="flex-1 bg-gradient-to-r from-rose-600 via-pink-600 to-fuchsia-600 hover:from-rose-500 hover:via-pink-500 hover:to-fuchsia-500 text-white font-semibold text-sm px-6 py-3 rounded-xl transition-all duration-200 shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 disabled:bg-zinc-700/50 disabled:text-gray-400 disabled:cursor-not-allowed disabled:opacity-50"
            name={isEntering ? "Entering..." : "Enter"}
            disabled={addedUrls.length === 0 || isEntering}
          />
        </div>
      </div>
    </div>
  </div>
);
