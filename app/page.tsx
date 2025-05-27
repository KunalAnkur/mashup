"use client";
import { AuthWrapper, Button, UrlSelection, SourceSelection, FileSelection } from "@/components";
import { Player } from "@/components/VideoPlayer";
import { useFileContext } from "@/context/FileContext";
import { RootState } from "@/lib/store";
import { OnboardState, OnboardStep } from "@/types/storeTypes";
import React, { use, useEffect, useState } from "react";
import { useSelector } from "react-redux";

const Page = () => {
  const state = useSelector<{ onboard: OnboardState }>(state => state.onboard) as OnboardState;
  const selectedFileIndex = useSelector((state: RootState) => state.room.selectedFileIndex);
  const [videoUrl, setVideoUrl] = useState<string>("");
  const { files } = useFileContext()
  useEffect(() => {
    if(files[selectedFileIndex]) {
      const url = URL.createObjectURL(files[selectedFileIndex]);
      setVideoUrl(url);
    }
  }, [selectedFileIndex, files]);
  const renderOnboardComponent = () => {
    switch (state.step) {
      case OnboardStep.URL_SELECTION:
        return <UrlSelection />
      case OnboardStep.FILE_SELECTION:
        return <FileSelection />
      case OnboardStep.AUTH_STEP:
        return <AuthWrapper />
      default: 
        return <SourceSelection />
    }
  }
  return (
    <div className="flex h-screen bg-[#030712] select-none">
      <div className="bg-gray-800 w-[40%] p-4">

      </div>
      <div className="flex-1 bg-gray-900 relative">
        {renderOnboardComponent()}
      </div>
    </div>
  );
};

export default Page;