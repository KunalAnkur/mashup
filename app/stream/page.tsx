"use client";
import React, { useRef, useState, useEffect } from "react";
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
import { isMobile } from "react-device-detect";
import { ExtendedFile } from "@/utils/filePersistence";

const StreamFilesPage = () => {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { files, setFiles } = useFileContext();
  const [showSpeedTip, setShowSpeedTip] = useState(true);

  // Auto-hide speed tip after 8 seconds
  useEffect(() => {
    if (!isMobile && showSpeedTip) {
      const timer = setTimeout(() => setShowSpeedTip(false), 8000);
      return () => clearTimeout(timer);
    }
  }, [showSpeedTip]);

  // Handle file drop - append to existing files
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = e.target.files;
    if (newFiles && newFiles.length > 0 && fileInputRef.current) {
      // For traditional file input, files won't persist (no handles)
      // Append new files to existing files instead of replacing
      const filesArray = Array.from(newFiles).map((f) => ({
        id: `${f.name}-${f.lastModified}-${crypto.randomUUID()}`,
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
      {/* Background Effects - Matching CTASection */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-1/4 w-48 h-48 sm:w-72 sm:h-72 md:w-96 md:h-96 bg-[#e11d48]/20 rounded-full blur-[80px] sm:blur-[100px] md:blur-[128px] animate-pulse-glow" />
        <div className="absolute bottom-0 right-1/4 w-48 h-48 sm:w-72 sm:h-72 md:w-96 md:h-96 bg-[#c026d3]/20 rounded-full blur-[80px] sm:blur-[100px] md:blur-[128px] animate-pulse-glow" style={{ animationDelay: '1.5s' }} />
      </div>

      {/* Floating Emojis - Hidden on small screens, visible on larger */}
      <div className="hidden sm:block absolute inset-0 overflow-hidden pointer-events-none z-10">
        <span className="absolute top-1/4 left-[8%] text-2xl md:text-4xl animate-float opacity-50">🎬</span>
        <span className="absolute top-1/3 right-[12%] text-xl md:text-3xl animate-float-delayed opacity-40">🍿</span>
        <span className="absolute bottom-1/3 left-[15%] text-3xl md:text-5xl animate-float opacity-30">😍</span>
        <span className="absolute top-1/2 right-[8%] text-2xl md:text-4xl animate-float-delayed opacity-40">🎉</span>
        <span className="absolute bottom-1/4 right-[20%] text-xl md:text-3xl animate-float opacity-50">❤️</span>
        <span className="absolute top-2/3 left-[12%] text-xl md:text-3xl animate-float-delayed opacity-40">⭐</span>
        <span className="absolute bottom-1/2 right-[15%] text-2xl md:text-4xl animate-float opacity-40">🎊</span>
        <span className="absolute top-[15%] left-[25%] text-xl md:text-3xl animate-float-delayed opacity-35">🎞️</span>
        <span className="absolute bottom-[20%] left-[30%] text-2xl md:text-4xl animate-float opacity-45">🎭</span>
      </div>

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
      
      {/* Content - Above Background */}
      <div className="relative z-20 w-full h-screen flex flex-col overflow-hidden">
        <PageHeader title="Stream Options" onBack={handleBack} />

        {/* Content - Top aligned on mobile, centered on desktop */}
        <div className="flex-1 w-full min-h-0 overflow-y-auto overflow-x-hidden md:flex md:items-center md:justify-center">
          <div className="w-full max-w-5xl lg:max-w-6xl 3xl:max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-10 py-4 sm:py-6 md:py-8">
            {/* Desktop-only: Internet Speed Tip - Auto disappears */}
            {!isMobile && showSpeedTip && (
              <div className={`hidden sm:flex items-center justify-center gap-2 mb-4 md:mb-5 transition-all duration-500 ${showSpeedTip ? 'opacity-100' : 'opacity-0'}`}>
                {/* <p className="text-white/40 text-[11px] md:text-xs tracking-wide">
                  ⚡ Min <span className="text-white/60 font-medium">5 Mbps</span> internet speed recommended for all users
                </p> */}
              </div>
            )}

            <div className="flex flex-col lg:flex-row items-stretch gap-3 sm:gap-4 md:gap-6 lg:gap-8 xl:gap-12 w-full">
              {/* Left Side - Screen Share Section - Hidden on mobile */}
              {!isMobile && (
                <div className="w-full lg:w-1/3 flex flex-col">
                  <ScreenShareBox handleScreenShareClick={handleScreenShareClick} />
                </div>
              )}
          
              {!isMobile && <ContentDivider />}

              {/* Right Side - File Selection - Full width on mobile */}
              <div className={`flex flex-col min-w-0 ${isMobile ? 'w-full' : 'w-full lg:w-2/3'}`}>
                <FileSelection />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StreamFilesPage;

