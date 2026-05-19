"use client";
import { SourceSelection } from "@/components";
import React from "react";
import { EntryPageHeader } from "@/components/UI";
import {
  appEntryPageShellClass,
  appFixedViewportPageClass,
} from "@/components/UI/classTokens";

const Page = () => {
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
