"use client";
import { SourceSelection, ProfileHeader } from "@/components";
import React from "react";

const Page = () => {
  return (
    <div className="relative h-screen bg-[#18181b] overflow-hidden">
      {/* Background Image with Overlay - Behind All Components */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1920&q=80"
          alt="Cinema couches background" 
          className="w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#18181b]/80 via-[#18181b]/60 to-[#18181b]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(225,29,72,0.12)_0%,_transparent_70%)]" />
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
