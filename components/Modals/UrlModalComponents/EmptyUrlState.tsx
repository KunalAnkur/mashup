import React from "react";
import { FaVideo, FaTimes, FaCheckCircle } from "react-icons/fa";

export const EmptyUrlState: React.FC = () => (
  <div className="flex flex-col items-center justify-center h-full gap-3 sm:gap-4 py-2 sm:py-4">
    {/* Preview Placeholder Cards */}
    <div className="w-full space-y-2 mb-2 sm:mb-3">
      {[1, 2].map((i) => (
        <div
          key={i}
          className="flex items-center gap-2 sm:gap-3 bg-gradient-to-br from-zinc-800/10 via-zinc-700/10 to-zinc-800/10 backdrop-blur-xl border border-dashed border-zinc-600/20 rounded-lg sm:rounded-xl px-2.5 sm:px-3 py-2 sm:py-2.5"
        >
          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20 backdrop-blur-sm border border-purple-500/30 flex items-center justify-center shrink-0">
            <FaVideo className="text-white/60 text-[10px] sm:text-xs" />
          </div>
          <div className="flex-1 h-2.5 sm:h-3 bg-zinc-700/20 rounded-full" />
          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-zinc-700/20 flex items-center justify-center">
            <FaTimes className="text-white/40 text-[10px] sm:text-xs" />
          </div>
        </div>
      ))}
    </div>

    {/* Tips Section */}
    <div className="w-full space-y-1.5 sm:space-y-2">
      <div className="flex items-start gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-white/70">
        <FaCheckCircle className="text-green-500/60 mt-0.5 shrink-0 text-[10px] sm:text-xs" />
        <span>Add multiple URLs for a playlist experience</span>
      </div>
      <div className="flex items-start gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-white/70">
        <FaCheckCircle className="text-green-500/60 mt-0.5 shrink-0 text-[10px] sm:text-xs" />
        <span>Supports direct video links from all platforms</span>
      </div>
      <div className="flex items-start gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-white/70">
        <FaCheckCircle className="text-green-500/60 mt-0.5 shrink-0 text-[10px] sm:text-xs" />
        <span>URLs will appear here as cards after adding</span>
      </div>
    </div>
  </div>
);

