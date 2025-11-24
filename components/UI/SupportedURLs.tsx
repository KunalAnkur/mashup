import { platforms } from "@/constants/urlPlatforms";
import React from "react";

function SupportedURLs() {
  return (
    <div className="w-1/2 flex flex-col">
      <h3 className="text-lg sm:text-xl font-bold text-gray-100 mb-4 sm:mb-6 font-parkinsans text-center">
        Supported platforms
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-5">
        {platforms.map((platform) => (
          <div
            key={platform.id}
            style={platform.bgStyle}
            className="aspect-square flex flex-col items-center justify-center rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 transition-all duration-300 hover:scale-105 group"
          >
            <div className="text-white group-hover:scale-110 transition-transform duration-300">
              {platform.icon}
            </div>
            <span className="text-xs sm:text-sm md:text-base font-bold text-white mt-2 sm:mt-3 text-center">
              {platform.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SupportedURLs;
