"use client";
import { SourceSelection, ProfileHeader } from "@/components";
import React from "react";
import { usePreventMobileScroll } from "@/hooks/usePreventMobileScroll";

const Page = () => {
  usePreventMobileScroll();
  
  return (
    <div className="relative h-screen overflow-hidden bg-[#111216] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(225,29,72,0.14),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.04),transparent_26%)]" />
      <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:32px_32px] [mask-image:radial-gradient(circle_at_center,black_22%,transparent_82%)]" />
      <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/22 to-transparent" />

      <div className="relative z-20 h-full">
        <ProfileHeader />
        <SourceSelection />
      </div>
    </div>
  );
};

export default Page;
