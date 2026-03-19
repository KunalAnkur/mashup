"use client";
import { SourceSelection } from "@/components";
import React from "react";
import { usePreventMobileScroll } from "@/hooks/usePreventMobileScroll";
import { EntryPageBackdrop, EntryPageHeader } from "@/components/UI";
import { appEntryPageShellClass } from "@/components/UI/classTokens";

const Page = () => {
  usePreventMobileScroll();
  
  return (
    <div className="relative h-screen overflow-hidden bg-[#09090c] text-white">
      <EntryPageBackdrop />

      <div className={appEntryPageShellClass}>
        <EntryPageHeader fixed />
        <SourceSelection />
      </div>
    </div>
  );
};

export default Page;
