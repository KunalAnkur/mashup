"use client";
import React, { useRef } from "react";
import { useFileContext } from "@/context/FileContext";
import { useTranslations } from "@/i18n/I18nProvider";
import {
  DragOverlay,
  useDragAndDrop,
  ACCEPTED_FILE_TYPES,
} from "@/components/Modals/DeviceModalComponents";
import { FileSelection } from "@/components";
import { Input } from "@/components/UI";
import { ExtendedFile } from "@/utils/filePersistence";
import {
  appSectionTitleTextClass,
  dashPageTitleWrapClass,
  dashPageContentWrapClass,
} from "@/components/UI/classTokens";

const StreamFilesPage = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { files, setFiles } = useFileContext();
  const tHome = useTranslations("home");

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

  return (
    <div className={dashPageContentWrapClass} {...dragHandlers}>
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

      <div className={dashPageTitleWrapClass}>
        <h1 className={appSectionTitleTextClass}>{tHome("fileShare")}</h1>
      </div>
      <div className="mx-auto flex w-full max-w-2xl flex-col">
        <FileSelection />
      </div>
    </div>
  );
};

export default StreamFilesPage;
