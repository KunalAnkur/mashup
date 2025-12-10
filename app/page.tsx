"use client";
import { SourceSelection, ProfileHeader } from "@/components";
import React from "react";

const Page = () => {
  return (
    <div className="flex h-screen bg-[#030712] overflow-hidden">
      <div className="hidden lg:block bg-zinc-800 lg:w-[50%] overflow-hidden">
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
      <div className="flex-1 bg-gray-900 relative overflow-hidden h-screen">
        <ProfileHeader />
        <SourceSelection />
      </div>
    </div>
  );
};

export default Page;
