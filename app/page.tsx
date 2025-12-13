"use client";
import { SourceSelection, ProfileHeader } from "@/components";
import React from "react";

const Page = () => {
  return (
    <div className="relative h-screen bg-[#18181b] overflow-hidden">
      {/* Background Effects - Matching CTASection */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#e11d48]/20 rounded-full blur-[128px] animate-pulse-glow" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#c026d3]/20 rounded-full blur-[128px] animate-pulse-glow" style={{ animationDelay: '1.5s' }} />
      </div>

      {/* Floating Emojis - Behind All Components */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
        <span className="absolute top-1/4 left-[8%] text-4xl animate-float opacity-50">🎬</span>
        <span className="absolute top-1/3 right-[12%] text-3xl animate-float-delayed opacity-40">🍿</span>
        <span className="absolute bottom-1/3 left-[15%] text-5xl animate-float opacity-30">😍</span>
        <span className="absolute top-1/2 right-[8%] text-4xl animate-float-delayed opacity-40">🎉</span>
        <span className="absolute bottom-1/4 right-[20%] text-3xl animate-float opacity-50">❤️</span>
        <span className="absolute top-2/3 left-[12%] text-3xl animate-float-delayed opacity-40">⭐</span>
        <span className="absolute bottom-1/2 right-[15%] text-4xl animate-float opacity-40">🎊</span>
        <span className="absolute top-[15%] left-[25%] text-3xl animate-float-delayed opacity-35">🎞️</span>
        <span className="absolute bottom-[20%] left-[30%] text-4xl animate-float opacity-45">🎭</span>
      </div>

      {/* Content - Above Background */}
      <div className="relative z-20 h-full">
        <ProfileHeader />
        <SourceSelection />
      </div>
    </div>
  );
};

export default Page;
