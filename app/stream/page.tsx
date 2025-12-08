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
import { FileSelection, ProfileHeader, Logo } from "@/components";
import { FaArrowLeft } from "react-icons/fa";
import { ScreenShareBox } from "@/components/ScreenShare/ScreenShareBox";
const StreamFilesPage = () => {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { files, setFiles } = useFileContext();

  // Handle file drop - append to existing files
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = e.target.files;
    if (newFiles && newFiles.length > 0 && fileInputRef.current) {
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
    router.push("/stream");
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
      
      {/* Header with logo, back button, and profile */}
      <div className="w-full flex items-center justify-between p-4 md:p-6 border-b border-white/10 relative z-40">
        <div className="flex items-center gap-4">
          <div className="flex items-center">
            <Logo size="sm" href="/" showText={true} />
          </div>
          <button
            onClick={handleBack}
            className="flex items-center text-gray-400 hover:text-white transition-colors"
          >
            <FaArrowLeft className="text-lg" />
          </button>
        </div>
        <h2 className="text-xl font-bold text-white absolute left-1/2 -translate-x-1/2">Stream Options</h2>
        <div className="flex items-center">
          <ProfileHeader />
        </div>
      </div>

      {/* Content */}
      <div className="  max-w-5xl lg:max-w-6xl 3xl:max-w-7xl flex h-full flex-1 items-center justify-center w-full overflow-y-auto overflow-x-hidden py-4 md:py-6">
        <div className="flex flex-col lg:flex-row items-stretch gap-4 lg:gap-8 xl:gap-12 w-full mx-auto px-6 md:px-10">
          {/* Left Side - Screen Share Section */}
            <ScreenShareBox handleScreenShareClick={handleScreenShareClick} />
    
      
          <ContentDivider />

          {/* Right Side - File Selection */}
          <div className="w-full lg:w-2/3 flex flex-col">
            <FileSelection />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StreamFilesPage;

