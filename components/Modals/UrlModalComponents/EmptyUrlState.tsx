import React from "react";
import { FaVideo, FaTimes, FaCheckCircle } from "react-icons/fa";

export const EmptyUrlState: React.FC = () => (
  <div className="flex flex-col items-center justify-center h-full gap-4">
    {/* Preview Placeholder Cards */}
    <div className="w-full space-y-2 mb-3">
      {[1, 2].map((i) => (
        <div
          key={i}
          className="flex items-center gap-3 bg-white/[0.03] rounded-xl px-3 py-2.5 border border-dashed border-white/10"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500/20 to-fuchsia-600/20 flex items-center justify-center shrink-0">
            <FaVideo className="text-gray-600 text-xs" />
          </div>
          <div className="flex-1 h-3 bg-white/[0.03] rounded-full" />
          <div className="w-6 h-6 rounded-lg bg-white/[0.02] flex items-center justify-center">
            <FaTimes className="text-gray-700 text-xs" />
          </div>
        </div>
      ))}
    </div>

    {/* Tips Section */}
    <div className="w-full space-y-2">
      <div className="flex items-start gap-2 text-xs text-gray-500">
        <FaCheckCircle className="text-green-500/60 mt-0.5 shrink-0" />
        <span>Add multiple URLs for a playlist experience</span>
      </div>
      <div className="flex items-start gap-2 text-xs text-gray-500">
        <FaCheckCircle className="text-green-500/60 mt-0.5 shrink-0" />
        <span>Supports direct video links from all platforms</span>
      </div>
      <div className="flex items-start gap-2 text-xs text-gray-500">
        <FaCheckCircle className="text-green-500/60 mt-0.5 shrink-0" />
        <span>URLs will appear here as cards after adding</span>
      </div>
    </div>
  </div>
);

