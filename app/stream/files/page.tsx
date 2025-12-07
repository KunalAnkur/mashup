"use client";
import React, { useRef, useState } from "react";
import { useFileContext } from "@/context/FileContext";
import { useRouter } from "next/navigation";
import {
  DragOverlay,
  UploadSection,
  ContentDivider,
  useDragAndDrop,
} from "@/components/Modals/DeviceModalComponents";
import { FileSelection, ProfileHeader, Logo } from "@/components";
import { FaArrowLeft } from "react-icons/fa";
import { showError } from "@/utils/toast";

const StreamFilesPage = () => {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { setFiles, isPersistenceSupported, requestFilePicker, showPermissionPrompt } = useFileContext();
  const [isLoading, setIsLoading] = useState(false);

  const handleOnVideoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0 && fileInputRef.current) {
      // For traditional file input, files won't persist (no handles)
      setFiles(Array.from(files));
      fileInputRef.current.value = "";
    }
  };

  const handleFileSelection = async () => {
    if (isPersistenceSupported) {
      // Use File System Access API for persistence
      try {
        setIsLoading(true);
        const selectedFiles = await requestFilePicker();
        
        if (selectedFiles.length > 0) {
          setFiles(selectedFiles);
        }
      } catch (error: any) {
        if (error.name === 'AbortError') {
          // User cancelled, do nothing
          return;
        }
        console.error('Error selecting files:', error);
        showError("Failed to select files", "Please check your browser permissions and try again.");
        // Fallback to traditional file input
        showPermissionPrompt();
        fileInputRef.current?.click();
      } finally {
        setIsLoading(false);
      }
    } else {
      // Fallback to traditional file input
      fileInputRef.current?.click();
    }
  };

  const { isDragging, dragHandlers } = useDragAndDrop(
    fileInputRef,
    handleOnVideoChange
  );

  const handleUploadClick = () => {
    handleFileSelection();
  };

  const handleBack = () => {
    router.push("/stream");
  };

  return (
    <div
      className="relative w-full h-full bg-[#18181b] flex flex-col items-center overflow-hidden min-h-screen"
      {...dragHandlers}
    >
      <DragOverlay isVisible={isDragging} />
      
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
        <h2 className="text-xl font-bold text-white absolute left-1/2 -translate-x-1/2">Select Your Files</h2>
        <div className="flex items-center">
          <ProfileHeader />
        </div>
      </div>

      {/* Content */}
      <div className="flex h-full flex-1 items-center justify-center w-full overflow-y-auto overflow-x-hidden py-4 md:py-6">
        <div className="flex flex-col lg:flex-row items-stretch gap-8 lg:gap-12 xl:gap-16 w-full max-w-5xl lg:max-w-6xl 3xl:max-w-7xl mx-auto px-6 md:px-10">
          {/* Left Side - Upload Section */}
          <UploadSection
            fileInputRef={fileInputRef}
            onUploadClick={handleUploadClick}
            onFileChange={handleOnVideoChange}
          />

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

