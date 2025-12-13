"use client";
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import { setRefers } from "@/lib/store/slices/roomSlice";
import { useRouter } from "next/navigation";
import {
  SupportedPlatformsGrid,
  UrlInputSection,
  useUrlManagement,
  getPlatformById,
  getUrlDisplayName,
} from "@/components/Modals/UrlModalComponents";
import { PageHeader } from "@/components/UI";

const SyncPage = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const authState = useSelector((state: RootState) => state.auth);

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
      dispatch(
        setRefers({
          refer: true,
          type: "sync",
          source: "url",
          urls: addedUrls.map((item) => item.url),
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
    <div className="relative w-full h-full bg-[#18181b] flex flex-col items-center overflow-hidden min-h-screen">
      {/* Background Effects - Matching CTASection */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#e11d48]/20 rounded-full blur-[128px] animate-pulse-glow" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#c026d3]/20 rounded-full blur-[128px] animate-pulse-glow" style={{ animationDelay: '1.5s' }} />
      </div>

      {/* Floating Emojis - Behind All Components */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
        <span className="absolute top-1/4 left-[8%] text-4xl animate-float opacity-50">🎬</span>
        <span className="absolute top-1/3 right-[12%] text-3xl animate-float-delayed opacity-40">🍿</span>
        <span className="absolute bottom-1/3 left-[15%] text-5xl animate-float opacity-30">😍</span>
        <span className="absolute top-1/2 right-[8%] text-4xl animate-float-delayed opacity-40">🎉</span>
        <span className="absolute bottom-1/4 right-[20%] text-3xl animate-float opacity-50">❤️</span>
        <span className="absolute top-2/3 left-[12%] text-3xl animate-float-delayed opacity-40">⭐</span>
        <span className="absolute bottom-1/2 right-[15%] text-4xl animate-float opacity-40">🎊</span>
        <span className="absolute top-[15%] left-[25%] text-3xl animate-float-delayed opacity-35">🎞️</span>
        <span className="absolute bottom-[20%] left-[30%] text-4xl animate-float opacity-45">🎭</span>
      </div>

      {/* Content - Above Background */}
      <div className="relative z-20 w-full h-screen flex flex-col">
        <PageHeader title="Enter Source URL" onBack={handleBack} />

        {/* Content - Centered Vertically and Horizontally */}
        <div className="flex-1 flex items-center justify-center w-full min-h-0">
          <div className="w-full max-w-7xl mx-auto px-6 md:px-10 py-6 md:py-10 overflow-y-auto overflow-x-hidden">
            <div className="flex flex-col lg:flex-row items-stretch gap-8 lg:gap-12 xl:gap-16 w-full">
              {/* Left Side - Supported Platforms */}
              <SupportedPlatformsGrid />

              {/* Right Side - URL Input */}
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
  );
};

export default SyncPage;
