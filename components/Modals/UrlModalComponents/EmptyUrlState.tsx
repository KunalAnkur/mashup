"use client";

import React from "react";
import { FaTimes, FaVideo } from "react-icons/fa";
import {
  appSyncPlaceholderRowClass,
  purpleAccentIconSurfaceClass,
} from "@/components/UI/classTokens";

const emptyUrlPlaceholderRemoveIconWrapClass =
  "flex h-7 w-7 items-center justify-center rounded-xl";

export const EmptyUrlState: React.FC = () => {
  return (
    <div className="flex flex-col gap-2.5">
      {[1, 2, 3].map((i) => (
        <div key={i} className={appSyncPlaceholderRowClass}>
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${purpleAccentIconSurfaceClass}`}
          >
            <FaVideo className="text-xs text-white/65" />
          </div>
          <div className="flex-1 space-y-2">
            <div className="h-2.5 rounded-full bg-white/[0.055]" />
            <div className="h-2 w-2/3 rounded-full bg-white/[0.035]" />
          </div>
          <div className={emptyUrlPlaceholderRemoveIconWrapClass}>
            <FaTimes className="text-[11px] text-white/35" />
          </div>
        </div>
      ))}
    </div>
  );
};
