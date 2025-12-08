import React from "react";
import { SectionTitle } from "../Modals/DeviceModalComponents/SectionTitle";
import { FaDesktop } from "react-icons/fa";

interface ScreenShareBoxProps {
  handleScreenShareClick: (platformName: string) => void;
}

export const ScreenShareBox: React.FC<ScreenShareBoxProps> = ({
  handleScreenShareClick,
}) => (
  <>
    <SectionTitle
      gradientFrom="from-fuchsia-500"
      gradientTo="to-purple-500"
      title="Screen Share"
    />
    <div className="flex-1 flex flex-col">
      <button
        onClick={() => handleScreenShareClick("screen")}
        className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-[#1f1f23] to-[#27272a] hover:from-fuchsia-600 hover:via-purple-600 hover:to-pink-600 hover:border-fuchsia-500/50 border border-white/10 rounded-2xl transition-all duration-300 cursor-pointer group shadow-xl p-6 md:p-8 min-h-[200px]"
      >
        <div className="flex items-center justify-center w-20 h-20 rounded-full bg-white/5 group-hover:bg-white/10 transition-all duration-300 mb-4">
          <FaDesktop className="w-10 h-10 text-gray-400 group-hover:text-white transition-colors duration-300" />
        </div>
        <span className="text-lg md:text-xl font-semibold text-gray-300 group-hover:text-white transition-all duration-300">
          Screen Share
        </span>
      </button>
    </div>
  </>
);

