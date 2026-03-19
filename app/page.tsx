"use client";
import { SourceSelection, ProfileHeader } from "@/components";
import React from "react";
import { usePreventMobileScroll } from "@/hooks/usePreventMobileScroll";

const Page = () => {
  usePreventMobileScroll();
  
  return (
    <div className="relative h-screen overflow-hidden bg-[#09090c] text-white">
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute inset-0 [background-image:radial-gradient(circle,rgba(255,255,255,0.055)_1px,transparent_1px)] [background-size:28px_28px] [mask-image:radial-gradient(ellipse_70%_70%_at_50%_50%,black_40%,transparent_100%)]" />

        <svg
          className="absolute inset-0 opacity-[0.035]"
          xmlns="http://www.w3.org/2000/svg"
          width="100%"
          height="100%"
        >
          <filter id="home-noise">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.75"
              numOctaves="4"
              stitchTiles="stitch"
            />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter="url(#home-noise)" />
        </svg>

        <div className="absolute -top-20 -left-16 h-[360px] w-[360px] rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.18)_0%,transparent_70%)] blur-[80px] animate-pulse-glow" />
        <div
          className="absolute -bottom-16 -right-10 h-[300px] w-[300px] rounded-full bg-[radial-gradient(circle,rgba(236,72,153,0.13)_0%,transparent_70%)] blur-[80px] animate-pulse-glow"
          style={{ animationDelay: "1.2s" }}
        />
        <div
          className="absolute bottom-[10%] left-[28%] h-[240px] w-[240px] rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.10)_0%,transparent_70%)] blur-[80px] animate-pulse-glow"
          style={{ animationDelay: "2.1s" }}
        />
      </div>

      <div className="relative z-20 mx-auto h-full w-full max-w-6xl">
        <ProfileHeader />
        <SourceSelection />
      </div>
    </div>
  );
};

export default Page;
