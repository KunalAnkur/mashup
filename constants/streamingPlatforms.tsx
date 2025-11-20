import React from "react";
import { StreamingPlatform } from "@/types/streamingTypes";

export const STREAMING_PLATFORMS: StreamingPlatform[] = [
  {
    name: "Netflix",
    url: "https://www.netflix.com",
    bgGradient: "bg-gradient-to-br from-red-600 to-red-700",
    logo: (
      <svg
        className="w-16 h-16 sm:w-20 sm:h-20"
        viewBox="0 0 111 30"
        fill="currentColor"
      >
        <path d="M105.062 14.28L111 30c-1.75-.25-3.499-.563-5.28-.845l-3.345-8.686-3.437 8.351c-1.687-.28-3.344-.376-5.031-.595l6.031-14.407L94.468 0h5.063l3.062 7.874 3.031-7.874h5.125l-5.687 14.28zM90.47 0h-4.594v27.25c1.5.094 3.062.156 4.594.343V0zm-8.563 26.937c-4.187-.281-8.375-.53-12.656-.625V0h4.687v21.875c2.688.062 5.375.28 7.969.405v4.657zM64.25 10.657v4.687h-6.406V26H53.22V0h13.125v4.687h-8.5v5.97h6.406zm-18.906-5.97V26.25c-1.563 0-3.156 0-4.688.062V4.687h-4.844V0h14.406v4.687h-4.874zM30.75 15.593c-2.062 0-4.5 0-6.25.095v6.968c2.75-.188 5.5-.406 8.281-.5v4.5l-12.968 1.032V0H32.78v4.687H24.5V11c1.813 0 4.594-.094 6.25-.094v4.687zM4.78 12.968v16.375C3.094 29.531 1.593 29.75 0 30V0h4.469l6.093 17.032V0h4.688v28.062c-1.656.282-3.344.376-5.125.625L4.78 12.968z" />
      </svg>
    ),
  },
  {
    name: "Disney+",
    url: "https://www.disneyplus.com",
    bgGradient: "bg-gradient-to-br from-blue-600 to-blue-800",
    logo: (
      <svg
        className="w-16 h-16 sm:w-20 sm:h-20"
        viewBox="0 0 120 34"
        fill="currentColor"
      >
        <text x="10" y="24" fontSize="20" fontWeight="bold">
          Disney+
        </text>
      </svg>
    ),
  },
  {
    name: "Amazon Prime",
    url: "https://www.primevideo.com",
    bgGradient: "bg-gradient-to-br from-cyan-500 to-blue-600",
    logo: (
      <svg
        className="w-16 h-16 sm:w-20 sm:h-20"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <text x="2" y="18" fontSize="8" fontWeight="bold">
          Prime
        </text>
      </svg>
    ),
  },
  {
    name: "Dailymotion",
    url: "https://www.dailymotion.com",
    bgGradient: "bg-gradient-to-br from-blue-500 to-indigo-600",
    logo: (
      <svg
        className="w-16 h-16 sm:w-20 sm:h-20"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <circle cx="12" cy="12" r="8" />
      </svg>
    ),
  },
  {
    name: "YouTube",
    url: "https://www.youtube.com",
    bgGradient: "bg-gradient-to-br from-red-500 to-red-600",
    logo: (
      <svg
        className="w-16 h-16 sm:w-20 sm:h-20"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
  {
    name: "Twitch",
    url: "https://www.twitch.tv",
    bgGradient: "bg-gradient-to-br from-purple-600 to-purple-700",
    logo: (
      <svg
        className="w-16 h-16 sm:w-20 sm:h-20"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z" />
      </svg>
    ),
  },
];
