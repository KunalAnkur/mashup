import React from "react";
import { SectionTitle } from "../Modals/DeviceModalComponents/SectionTitle";
import { FaDesktop } from "react-icons/fa";

interface ScreenShareBoxProps {
  handleScreenShareClick: (platformName: string) => void;
}

const ScreenShareInfo: React.FC = () => (
  <div className="p-3 sm:p-4 bg-gradient-to-br from-zinc-800/15 via-zinc-700/15 to-zinc-800/15 backdrop-blur-xl rounded-lg sm:rounded-xl border border-zinc-600/15">
    <p className="text-white/80 text-xs sm:text-sm text-center leading-relaxed">
      <span className="text-white/90 font-semibold">Share your screen:</span>
      <br />
      <span className="text-white/60 text-xs">Be sure to enable audio while sharing to include audio</span>
    </p>
  </div>
);

export const ScreenShareBox: React.FC<ScreenShareBoxProps> = ({
  handleScreenShareClick,
}) => (
  <div className="flex flex-col w-full h-full">
    <SectionTitle
      gradientFrom="from-fuchsia-500"
      gradientTo="to-purple-500"
      title="Screen Share"
    />
    <div className="flex flex-1 flex-col gap-3 sm:gap-4">
      <button
        onClick={() => handleScreenShareClick("screen")}
        className="relative flex flex-col items-center justify-center bg-gradient-to-br from-zinc-800/15 via-zinc-700/15 to-zinc-800/15 backdrop-blur-2xl border border-zinc-600/15 hover:from-zinc-700/25 hover:via-zinc-600/25 hover:to-zinc-700/25 hover:border-zinc-500/30 rounded-xl sm:rounded-2xl transition-all duration-300 cursor-pointer group shadow-xl flex-1 min-h-[140px] sm:min-h-[180px] p-4 sm:p-6 overflow-hidden"
      >
        {/* Gradient glow effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-600/10 via-zinc-500/10 to-zinc-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl sm:rounded-2xl" />
        {/* Shiny gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-shimmer rounded-xl sm:rounded-2xl transition-opacity duration-300" />
        <div className="relative flex flex-col items-center justify-center w-full h-full z-10">
          <div className="flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-zinc-700/20 to-zinc-600/20 backdrop-blur-sm border border-zinc-500/25 group-hover:from-zinc-600/30 group-hover:to-zinc-500/30 group-hover:border-zinc-400/40 transition-all duration-300 mb-3 sm:mb-4">
            <FaDesktop className="w-8 h-8 sm:w-10 sm:h-10 text-zinc-300 group-hover:text-white transition-all duration-300" />
          </div>
          <span className="text-base sm:text-lg md:text-xl font-semibold text-white/90 group-hover:text-white transition-all duration-300">
            Screen Share
          </span>
        </div>
      </button>
      <ScreenShareInfo />
    </div>
  </div>
);

