"use client";

import React from "react";
import { FaTimes, FaVideo } from "react-icons/fa";
import {
  appSyncPlaceholderRowClass,
  purpleAccentIconSurfaceClass,
} from "@/components/UI/classTokens";

const emptyUrlPlaceholderRemoveIconWrapClass =
  "flex h-6 w-6 items-center justify-center rounded-dashSm";

export const EmptyUrlState: React.FC = () => {
  return (
    <div className="flex flex-col gap-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className={appSyncPlaceholderRowClass}>
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-dashSm ${purpleAccentIconSurfaceClass}`}
          >
            <FaVideo className="text-[11px]" />
          </div>
          <div className="flex-1 space-y-1.5">
            <div className="h-2.5 rounded-full bg-white/[0.06]" />
            <div className="h-2 w-2/3 rounded-full bg-white/[0.04]" />
          </div>
          <div className={emptyUrlPlaceholderRemoveIconWrapClass}>
            <FaTimes className="text-[10px] text-dashTextMute" />
          </div>
        </div>
      ))}
    </div>
  );
};
