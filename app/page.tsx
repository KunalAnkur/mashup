"use client";
import {
  AuthWrapper,
  /*  UrlSelection, */
  SourceSelection,
  /* FileSelection, */
} from "@/components";
import { useFileContext } from "@/context/FileContext";
import { RootState } from "@/lib/store";
import { OnboardState, OnboardStep } from "@/types/storeTypes";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";

const Page = () => {
  const state = useSelector<{ onboard: OnboardState }>(
    (state) => state.onboard
  ) as OnboardState;
  const selectedFileIndex = useSelector(
    (state: RootState) => state.room.selectedFileIndex
  );
  const [videoUrl, setVideoUrl] = useState<string>("");
  const { files } = useFileContext();
  useEffect(() => {
    if (files[selectedFileIndex]) {
      const url = URL.createObjectURL(files[selectedFileIndex]);
      setVideoUrl(url);
    }
  }, [selectedFileIndex, files]);
  const renderOnboardComponent = () => {
    switch (state.step) {
      /* case OnboardStep.URL_SELECTION:
        return <UrlSelection />; */
      /* case OnboardStep.FILE_SELECTION:
        return <FileSelection />; */
      case OnboardStep.AUTH_STEP:
        return <AuthWrapper />;
      default:
        return <SourceSelection />;
    }
  };
  return (
    <div className="flex h-screen bg-[#030712] select-none">
      <div className="hidden lg:block bg-zinc-800 lg:w-[50%]">
        <video
          poster="https://i.ibb.co/PGNvtC0w/Screenshot-2025-05-28-at-13-49-03.png"
          className="object-cover w-full h-full"
          crossOrigin="anonymous"
          src={
            "https://videos.pexels.com/video-files/2324293/2324293-uhd_3840_2160_25fps.mp4"
          }
          autoPlay
          loop
          muted
        />
      </div>
      <div className="flex-1 bg-gray-900 relative">
        {renderOnboardComponent()}
      </div>
    </div>
  );
};

export default Page;
