"use client";
import React, { useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import { setPlaylist, setRefers } from "@/lib/store/slices/roomSlice";
import { useRouter } from "next/navigation";
import {
  SupportedPlatformsGrid,
  UrlInputSection,
  useUrlManagement,
  getPlatformById,
  getUrlDisplayName,
} from "@/components/Modals/UrlModalComponents";
import { PageHeader } from "@/components/UI";
import { Playlist } from "@/types/storeTypes";
import { useIsMobile } from "@/hooks";
import MobileWarningModal from "@/components/Modals/MobileWarningModal";

const SyncPage = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const authState = useSelector((state: RootState) => state.auth);
  const isMobile = useIsMobile();

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
  const [showMobileWarning, setShowMobileWarning] = useState(false);

  const handleOnSourceUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSourceUrlInput(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !isAddDisabled) {
      handleAddUrl();
    }
  };

  // Core room entry logic
  const proceedToEnterRoom = useCallback(async () => {
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
  }, [addedUrls, isEntering, dispatch, authState.isAuthenticated, router]);

  // Handler that shows warning on mobile, or proceeds directly on desktop
  const handleOnEnterRoom = useCallback(() => {
    if (addedUrls.length === 0 || isEntering) return;
    
    if (isMobile) {
      setShowMobileWarning(true);
    } else {
      proceedToEnterRoom();
    }
  }, [addedUrls.length, isEntering, isMobile, proceedToEnterRoom]);

  // Handle continuing after mobile warning
  const handleMobileWarningContinue = useCallback(() => {
    setShowMobileWarning(false);
    proceedToEnterRoom();
  }, [proceedToEnterRoom]);

  const handleBack = () => {
    router.push("/");
  };

  return (
    <>
      {/* Mobile Warning Modal */}
      <MobileWarningModal
        isOpen={showMobileWarning}
        onClose={() => setShowMobileWarning(false)}
        onContinue={handleMobileWarningContinue}
      />
      
      <div className="relative w-full h-full bg-[#18181b] flex flex-col items-center overflow-hidden min-h-screen">
        {/* Background Effects - Matching CTASection - Responsive sizing */}
        <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-1/4 w-48 h-48 sm:w-64 sm:h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 bg-[#e11d48]/20 rounded-full blur-[48px] sm:blur-[64px] md:blur-[96px] lg:blur-[128px] animate-pulse-glow" />
        <div className="absolute bottom-0 right-1/4 w-48 h-48 sm:w-64 sm:h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 bg-[#c026d3]/20 rounded-full blur-[48px] sm:blur-[64px] md:blur-[96px] lg:blur-[128px] animate-pulse-glow" style={{ animationDelay: '1.5s' }} />
      </div>

      {/* Floating Emojis - Behind All Components - Hidden on mobile, shown on tablet+ */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-10 hidden sm:block">
        <span className="absolute top-1/4 left-[8%] text-xl sm:text-2xl md:text-3xl lg:text-4xl animate-float opacity-50">🎬</span>
        <span className="absolute top-1/3 right-[12%] text-lg sm:text-xl md:text-2xl lg:text-3xl animate-float-delayed opacity-40">🍿</span>
        <span className="absolute bottom-1/3 left-[15%] text-2xl sm:text-3xl md:text-4xl lg:text-5xl animate-float opacity-30">😍</span>
        <span className="absolute top-1/2 right-[8%] text-xl sm:text-2xl md:text-3xl lg:text-4xl animate-float-delayed opacity-40">🎉</span>
        <span className="absolute bottom-1/4 right-[20%] text-lg sm:text-xl md:text-2xl lg:text-3xl animate-float opacity-50">❤️</span>
        <span className="absolute top-2/3 left-[12%] text-lg sm:text-xl md:text-2xl lg:text-3xl animate-float-delayed opacity-40">⭐</span>
        <span className="absolute bottom-1/2 right-[15%] text-xl sm:text-2xl md:text-3xl lg:text-4xl animate-float opacity-40">🎊</span>
        <span className="absolute top-[15%] left-[25%] text-lg sm:text-xl md:text-2xl lg:text-3xl animate-float-delayed opacity-35">🎞️</span>
        <span className="absolute bottom-[20%] left-[30%] text-xl sm:text-2xl md:text-3xl lg:text-4xl animate-float opacity-45">🎭</span>
      </div>

      {/* Content - Above Background */}
      <div className="relative z-20 w-full h-screen flex flex-col">
        <PageHeader title="Enter Source URL" onBack={handleBack} />

      {/* Content - Centered Vertically and Horizontally */}
      <div className="flex-1 flex items-center justify-center w-full min-h-0">
        <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10 py-3 sm:py-4 md:py-6 lg:py-8 xl:py-10 overflow-y-auto overflow-x-hidden">
          <div className="flex flex-col lg:flex-row items-stretch gap-3 sm:gap-4 md:gap-6 lg:gap-8 xl:gap-12 2xl:gap-16 w-full">
            {/* Left Side - Supported Platforms - Hidden on SM, XS, shown on MD+ but only on XL+ as side-by-side */}
            <div className="hidden lg:block lg:w-1/2">
              <SupportedPlatformsGrid />
            </div>

            {/* Right Side - URL Input - Full width on mobile/tablet, half on LG+ */}
            <div className="w-full lg:w-1/2 flex flex-col min-h-0">
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
    </>
  );
};

export default SyncPage;
