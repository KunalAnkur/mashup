import React from "react";
import { FaVideo, FaTimes, FaCheckCircle } from "react-icons/fa";

export const EmptyUrlState: React.FC = () => (
  <div className="flex flex-col items-center justify-center h-full gap-4">
    {/* Preview Placeholder Cards */}
    <div className="w-full space-y-2 mb-3">
      {[1, 2].map((i) => (
        <div
          key={i}
          className="flex items-center gap-3 bg-gradient-to-br from-zinc-800/10 via-zinc-700/10 to-zinc-800/10 backdrop-blur-xl border border-dashed border-zinc-600/20 rounded-xl px-3 py-2.5"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20 backdrop-blur-sm border border-purple-500/30 flex items-center justify-center shrink-0">
            <FaVideo className="text-white/60 text-xs" />
          </div>
          <div className="flex-1 h-3 bg-zinc-700/20 rounded-full" />
          <div className="w-6 h-6 rounded-lg bg-zinc-700/20 flex items-center justify-center">
            <FaTimes className="text-white/40 text-xs" />
          </div>
        </div>
      ))}
    </div>

    {/* Tips Section */}
    <div className="w-full space-y-2">
      <div className="flex items-start gap-2 text-xs text-white/70">
        <FaCheckCircle className="text-green-500/60 mt-0.5 shrink-0" />
        <span>Add multiple URLs for a playlist experience</span>
      </div>
      <div className="flex items-start gap-2 text-xs text-white/70">
        <FaCheckCircle className="text-green-500/60 mt-0.5 shrink-0" />
        <span>Supports direct video links from all platforms</span>
      </div>
      <div className="flex items-start gap-2 text-xs text-white/70">
        <FaCheckCircle className="text-green-500/60 mt-0.5 shrink-0" />
        <span>URLs will appear here as cards after adding</span>
      </div>
    </div>
  </div>
);

