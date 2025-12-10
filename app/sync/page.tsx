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
      <PageHeader title="Enter Source URL" onBack={handleBack} />

      {/* Content */}
      <div className="flex h-full flex-1 items-center justify-center w-full overflow-y-auto overflow-x-hidden py-6 md:py-10">
        <div className="flex flex-col lg:flex-row items-stretch gap-8 lg:gap-12 xl:gap-16 w-full max-w-7xl mx-auto px-6 md:px-10">
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
  );
};

export default SyncPage;
