"use client";
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/lib/store";
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
import { Playlist } from "@/types/storeTypes";
import {
  appSectionTitleTextClass,
  dashPageTitleWrapClass,
  dashPageContentWrapClass,
} from "@/components/UI/classTokens";

const SyncPage = () => {
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

  return (
    <div className={dashPageContentWrapClass}>
      {/* Single boxed column, matching File Share's pattern — no more 2-way split. Boxed +
          centered (both axes) scoped to this page only; dashPageContentWrapClass itself stays
          untouched/top-aligned for the other sub-pages. */}
      <div className="flex min-h-full w-full flex-col items-center justify-center">
        <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-4 sm:gap-5 md:gap-6">
          <div className={`${dashPageTitleWrapClass} justify-center`}>
            <h1 className={appSectionTitleTextClass}>{t("title")}</h1>
          </div>

          <div className="w-full rounded-dashMd bg-dashSurface p-4 text-left sm:p-5 md:p-6">
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
              onEnterRoom={handleOnEnterRoom}
              getPlatformById={getPlatformById}
              getUrlDisplayName={getUrlDisplayName}
              isAdding={isAdding}
              isEntering={isEntering}
            />
          </div>

          {/* No card background here on purpose — just the heading + tiles, per owner request */}
          <div className="w-full text-left">
            <SupportedPlatformsGrid />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SyncPage;
