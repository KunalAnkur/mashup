import React from "react";
import { STREAMING_PLATFORMS } from "@/constants/streamingPlatforms";
import { SectionTitle } from "./SectionTitle";

interface PlatformCardProps {
  platform: (typeof STREAMING_PLATFORMS)[0];
  onClick: (platformName: string) => void;
}

const PlatformCard: React.FC<PlatformCardProps> = ({ platform, onClick }) => (
  <button
    onClick={() => onClick(platform.name)}
    style={platform.bgStyle}
    className="aspect-square flex flex-col items-center justify-center hover:scale-105 rounded-2xl transition-all duration-300 cursor-pointer shadow-lg p-6 md:p-7 group min-h-[140px] md:min-h-[160px]"
  >
    <div className="text-white group-hover:scale-110 transition-transform duration-300 text-4xl md:text-5xl">
      {platform.logo}
    </div>
    <span className="text-sm md:text-base font-bold text-white mt-3 text-center">
      {platform.name}
    </span>
  </button>
);

interface PlatformGridProps {
  onPlatformClick: (platformName: string) => void;
}

export const PlatformGrid: React.FC<PlatformGridProps> = ({
  onPlatformClick,
}) => (
  <>
    <SectionTitle
      gradientFrom="from-fuchsia-500"
      gradientTo="to-purple-500"
      title="Choose a platform to screenshare"
    />
    <div className="flex-1 flex flex-col">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 content-start">
        {STREAMING_PLATFORMS.map((platform, index) => (
          <PlatformCard
            key={index}
            platform={platform}
            onClick={onPlatformClick}
          />
        ))}
      </div>
    </div>
  </>
);

