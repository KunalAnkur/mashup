"use client";
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import { usePreventMobileScroll } from "@/hooks/usePreventMobileScroll";
import { setPlaylist, setRefers } from "@/lib/store/slices/roomSlice";
import { useRouter } from "next/navigation";
import { useTranslations } from "@/i18n/I18nProvider";
import {
  SupportedPlatformsGrid,
  UrlInputSection,
  useUrlManagement,
  getPlatformById,
  getUrlDisplayName,
} from "@/components/Modals/UrlModalComponents";
import { EntryPageBackdrop, EntryPageHeader } from "@/components/UI";
import { Playlist } from "@/types/storeTypes";
import {
  appEntryPageContentWrapClass,
  appEntryPageFixedHeaderOffsetClass,
  appEntryPageInsetClass,
  appEntryPageShellClass,
} from "@/components/UI/classTokens";

const SyncPage = () => {
  usePreventMobileScroll();
  const dispatch = useDispatch();
  const router = useRouter();
  const authState = useSelector((state: RootState) => state.auth);
  const t = useTranslations("sync");

  const {
    sourceUrlInput,
    setSourceUrlInput,
    addedUrls,
    isAddDisabled,
    tooltipMessage,
    loadingMetadata,
    isAdding,
    handleAddUrl,
    handleRemoveUrl,
  } = useUrlManagement();
  
  const [isEntering, setIsEntering] = useState(false);

  const handleOnSourceUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSourceUrlInput(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !isAddDisabled) {
      handleAddUrl();
    }
  };

  const handleOnEnterRoom = async () => {
    if (addedUrls.length === 0 || isEntering) return;
    
    setIsEntering(true);
    try {
      // Convert addedUrls to Playlist format
      const playlist: Playlist[] = addedUrls.map((addedUrl, index) => ({
        id: crypto.randomUUID(),
        type: "sync",
        source: "url",
        link: addedUrl.url,
        selected: index === 0, // First item is selected
        onlyAudio: false,
        metadata: addedUrl.metadata || {},
      }));

      // Store playlist in roomSlice
      dispatch(setPlaylist(playlist));
      
      // Set refer flag so AuthGuard can create the room
      dispatch(
        setRefers({
          refer: true,
        })
      );
      
      if (!authState.isAuthenticated) {
        router.push("/login");
      }
      // If authenticated, AuthGuard will handle room creation and navigation
    } finally {
      // Keep loading state for a bit to show feedback, then reset if navigation doesn't happen
      setTimeout(() => setIsEntering(false), 1000);
    }
  };

  const handleBack = () => {
    router.push("/");
  };

  return (
    <div className="relative h-screen overflow-hidden bg-[#09090c] text-white">
      <EntryPageBackdrop />

      {/* Content - Above Background */}
      <div className={appEntryPageShellClass}>
        <EntryPageHeader title={t("title")} fixed showBrandOnSubpage />

        <div className={`flex-1 w-full min-h-0 overflow-hidden overflow-x-hidden md:flex md:items-center md:justify-center md:overflow-y-auto ${appEntryPageFixedHeaderOffsetClass}`}>
          <div className={appEntryPageInsetClass}>
            <div className={appEntryPageContentWrapClass}>
              <div className="flex w-full flex-col items-stretch gap-3 sm:gap-4 md:gap-6 lg:flex-row lg:gap-8 xl:gap-12 2xl:gap-16">
                <div className="hidden lg:block lg:w-1/2 lg:self-stretch">
                  <SupportedPlatformsGrid />
                </div>

                <div className="flex w-full min-h-0 flex-col lg:w-1/2 lg:self-stretch">
                  <UrlInputSection
                    sourceUrlInput={sourceUrlInput}
                    onSourceUrlChange={handleOnSourceUrlChange}
                    onKeyDown={handleKeyDown}
                    onAddUrl={handleAddUrl}
                    isAddDisabled={isAddDisabled}
                    tooltipMessage={tooltipMessage}
                    addedUrls={addedUrls}
                    loadingMetadata={loadingMetadata}
                    onRemoveUrl={handleRemoveUrl}
                    onCancel={handleBack}
                    onEnterRoom={handleOnEnterRoom}
                    getPlatformById={getPlatformById}
                    getUrlDisplayName={getUrlDisplayName}
                    isAdding={isAdding}
                    isEntering={isEntering}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SyncPage;
