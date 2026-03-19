"use client";
import React, { useRef } from "react";
import { useFileContext } from "@/context/FileContext";
import { useRouter } from "next/navigation";
import { useTranslations } from "@/i18n/I18nProvider";
import { usePreventMobileScroll } from "@/hooks/usePreventMobileScroll";
import {
  ContentDivider,
  DragOverlay,
  useDragAndDrop,
  ACCEPTED_FILE_TYPES,
} from "@/components/Modals/DeviceModalComponents";
import { FileSelection } from "@/components";
import { EntryPageBackdrop, EntryPageHeader, Input } from "@/components/UI";
import { ScreenShareBox } from "@/components/ScreenShare/ScreenShareBox";
import { isMobile } from "react-device-detect";
import { ExtendedFile } from "@/utils/filePersistence";
import {
  appEntryPageContentWrapClass,
  appEntryPageFixedHeaderOffsetClass,
  appEntryPageInsetClass,
  appEntryPageShellClass,
} from "@/components/UI/classTokens";

const StreamFilesPage = () => {
  usePreventMobileScroll();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { files, setFiles } = useFileContext();
  const t = useTranslations("stream");

  // Handle file drop - append to existing files
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = e.target.files;
    if (newFiles && newFiles.length > 0 && fileInputRef.current) {
      // For traditional file input, files won't persist (no handles)
      // Append new files to existing files instead of replacing
      const filesArray = Array.from(newFiles).map((f) => ({
        id: crypto.randomUUID(),
        selected: false,
        onlyAudio: false,
        file: f as File,
      } as ExtendedFile));
      const next = [...files, ...filesArray];
      if (!next.some((f) => f.selected) && next.length > 0) {
        next[0].selected = true;
      }
      setFiles(next);
      fileInputRef.current.value = "";
    }
  };

  // Drag and drop functionality for the whole page
  const { isDragging, dragHandlers } = useDragAndDrop(
    fileInputRef,
    handleFileChange
  );

  const handleScreenShareClick = () => {
    router.push(`/stream/screen`);
  };

  return (
    <div
      className="relative h-screen overflow-hidden bg-[#09090c] text-white"
      {...dragHandlers}
    >
      <EntryPageBackdrop />

      <DragOverlay isVisible={isDragging} />
      
      {/* Hidden file input for drag and drop */}
      <Input
        variant="raw"
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_FILE_TYPES}
        multiple
        className="hidden"
        onChange={handleFileChange}
      />
      
      {/* Content - Above Background */}
      <div className={appEntryPageShellClass}>
        <EntryPageHeader title={t("title")} fixed showBrandOnSubpage />

        {/* Content - Top aligned on mobile, centered on desktop */}
        <div className={`flex-1 w-full min-h-0 overflow-hidden md:overflow-y-auto overflow-x-hidden md:flex md:items-center md:justify-center ${appEntryPageFixedHeaderOffsetClass}`}>
          <div className={appEntryPageInsetClass}>
            <div className={appEntryPageContentWrapClass}>
              <div className="flex w-full flex-col items-stretch gap-3 sm:gap-4 md:gap-6 lg:flex-row lg:gap-8 xl:gap-12">
                {/* Left Side - Screen Share Section - Hidden on mobile */}
                {!isMobile && (
                  <div className="flex w-full flex-col lg:w-1/3">
                    <ScreenShareBox handleScreenShareClick={handleScreenShareClick} />
                  </div>
                )}

                {!isMobile && <ContentDivider />}

                {/* Right Side - File Selection - Full width on mobile */}
                <div className={`flex min-w-0 flex-col ${isMobile ? "w-full" : "w-full lg:w-2/3"}`}>
                  <FileSelection />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StreamFilesPage;
