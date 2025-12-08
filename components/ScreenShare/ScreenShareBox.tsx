import React from "react";
import { SectionTitle } from "../Modals/DeviceModalComponents/SectionTitle";
import { FaDesktop } from "react-icons/fa";

interface ScreenShareBoxProps {
  handleScreenShareClick: (platformName: string) => void;
}

const ScreenShareInfo: React.FC = () => (
  <div className="p-4 bg-gradient-to-br from-purple-500/10 via-fuchsia-500/10 to-pink-500/10 rounded-xl border border-purple-500/20">
    <p className="text-gray-300 text-xs text-center leading-relaxed">
      <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-fuchsia-400 to-pink-400 font-semibold">Share your screen:</span>
      <br />
      <span className="text-gray-400">Share any browser tab with others in real-time</span>
    </p>
  </div>
);

export const ScreenShareBox: React.FC<ScreenShareBoxProps> = ({
  handleScreenShareClick,
}) => (
  <div className="flex flex-col w-1/3">
    <SectionTitle
      gradientFrom="from-fuchsia-500"
      gradientTo="to-purple-500"
      title="Screen Share"
    />
    <div className="flex flex-1 flex-col gap-4">
      <button
        onClick={() => handleScreenShareClick("screen")}
        className="flex flex-col items-center justify-center bg-gradient-to-br from-[#1f1f23] to-[#27272a] hover:from-rose-600 hover:via-pink-600 hover:to-fuchsia-600 hover:border-pink-500/50 rounded-2xl transition-all duration-300 cursor-pointer group shadow-xl flex-1"
      >
        <div className="flex items-center justify-center w-20 h-20 rounded-full bg-white/5 group-hover:bg-white/10 transition-all duration-300 mb-4">
          <FaDesktop className="w-10 h-10 text-gray-400 group-hover:text-white transition-all duration-300" />
        </div>
        <span className="text-lg md:text-xl font-semibold text-gray-300 group-hover:text-white transition-all duration-300">
          Screen Share
        </span>
      </button>
      <ScreenShareInfo />
    </div>
  </div>
);

