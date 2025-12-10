"use client";
import React, { useRef } from "react";
import { useFileContext } from "@/context/FileContext";
import { useRouter } from "next/navigation";
import {
  ContentDivider,
  DragOverlay,
  useDragAndDrop,
  ACCEPTED_FILE_TYPES,
} from "@/components/Modals/DeviceModalComponents";
import { FileSelection } from "@/components";
import { PageHeader } from "@/components/UI";
import { ScreenShareBox } from "@/components/ScreenShare/ScreenShareBox";

const StreamFilesPage = () => {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { files, setFiles } = useFileContext();

  // Handle file drop - append to existing files
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = e.target.files;
    if (newFiles && newFiles.length > 0 && fileInputRef.current) {
      // For traditional file input, files won't persist (no handles)
      // Append new files to existing files instead of replacing
      const filesArray = Array.from(newFiles);
      setFiles([...files, ...filesArray]);
      fileInputRef.current.value = "";
    }
  };

  // Drag and drop functionality for the whole page
  const { isDragging, dragHandlers } = useDragAndDrop(
    fileInputRef,
    handleFileChange
  );

  const handleBack = () => {
    router.push("/");
  };

  const handleScreenShareClick = (platformName: string) => {
    router.push(`/stream/screen`);
  };

  return (
    <div
      className="relative w-full h-full bg-[#18181b] flex flex-col items-center overflow-hidden min-h-screen"
      {...dragHandlers}
    >
      <DragOverlay isVisible={isDragging} />
      
      {/* Hidden file input for drag and drop */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_FILE_TYPES}
        multiple
        className="hidden"
        onChange={handleFileChange}
      />
      
      <PageHeader title="Stream Options" onBack={handleBack} />

      {/* Content */}
      <div className="max-w-5xl lg:max-w-6xl 3xl:max-w-7xl flex h-full flex-1 items-center justify-center w-full overflow-y-auto overflow-x-hidden py-4 sm:py-6 px-4 sm:px-6 md:px-10">
        <div className="flex flex-col lg:flex-row items-stretch gap-4 sm:gap-6 lg:gap-8 xl:gap-12 w-full mx-auto">
          {/* Left Side - Screen Share Section */}
          <div className="w-full lg:w-1/3 flex flex-col">
            <ScreenShareBox handleScreenShareClick={handleScreenShareClick} />
          </div>
      
          <ContentDivider />

          {/* Right Side - File Selection */}
          <div className="w-full lg:w-2/3 flex flex-col min-w-0">
            <FileSelection />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StreamFilesPage;

