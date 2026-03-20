"use client";
import { SourceSelection } from "@/components";
import React from "react";
import { usePreventMobileScroll } from "@/hooks/usePreventMobileScroll";
import { EntryPageHeader } from "@/components/UI";
import {
  appEntryPageShellClass,
  appFixedViewportPageClass,
} from "@/components/UI/classTokens";

const Page = () => {
  usePreventMobileScroll();
  
  return (
    <div className={appFixedViewportPageClass}>
      <div className={appEntryPageShellClass}>
        <EntryPageHeader fixed />
        <SourceSelection />
      </div>
    </div>
  );
};

export default Page;
