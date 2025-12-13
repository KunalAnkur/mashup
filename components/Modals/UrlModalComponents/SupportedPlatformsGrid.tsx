import React from "react";
import { platforms } from "@/constants/urlPlatforms";
import { SectionTitle } from "../DeviceModalComponents/SectionTitle";

interface PlatformCardProps {
  platform: (typeof platforms)[0];
}

const PlatformCard: React.FC<PlatformCardProps> = ({ platform }) => (
  <div
    style={platform.bgStyle}
    className="aspect-square flex flex-col items-center justify-center rounded-2xl shadow-lg p-5 md:p-6 transition-all duration-300 hover:scale-105 hover:shadow-xl group cursor-pointer min-h-[120px] md:min-h-[140px]"
  >
    <div className="text-white group-hover:scale-110 transition-transform duration-300 text-3xl md:text-4xl">
      {platform.icon}
    </div>
    <span className="text-sm md:text-base font-bold text-white mt-3 text-center">
      {platform.name}
    </span>
  </div>
);

export const SupportedPlatformsGrid: React.FC = () => (
  <div className="w-full lg:w-1/2 flex flex-col">
    <SectionTitle
      gradientFrom="from-rose-500"
      gradientTo="to-pink-500"
      title="Supported Platforms"
    />
    <div className="bg-gradient-to-br from-zinc-800/15 via-zinc-700/15 to-zinc-800/15 backdrop-blur-lg border border-zinc-600/15 rounded-2xl p-5">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {platforms.map((platform) => (
          <PlatformCard key={platform.id} platform={platform} />
        ))}
      </div>
    </div>
  </div>
);

