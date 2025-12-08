"use client";
import React from "react";
import { Logo, ProfileHeader } from "@/components";
import { FaArrowLeft } from "react-icons/fa";

type PageHeaderProps = {
  title: string;
  onBack: () => void;
  logoGap?: "gap-4" | "gap-8";
};

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  onBack,
  logoGap = "gap-4",
}) => {
  return (
    <div className="w-full flex items-center justify-between px-4 md:px-6 py-3 md:py-4 border-b border-white/10 relative z-40 bg-[#18181b]">
      {/* Left Section: Back Button + Logo */}
      <div className="flex items-center gap-5 flex-1 min-w-0">
        <button
          onClick={onBack}
          className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 active:bg-white/15 text-gray-300 hover:text-white transition-all duration-200 flex-shrink-0 group"
          aria-label="Go back"
        >
          <FaArrowLeft className="text-base group-hover:-translate-x-0.5 transition-transform duration-200" />
        </button>
        <div className="h-5 w-px bg-white/10 flex-shrink-0"></div>
        <div className="flex items-center flex-shrink-0">
          <Logo size="sm" href="/" showText={true} />
        </div>
      </div>

      {/* Center Section: Title */}
      <div className="flex-1 flex justify-center items-center px-4">
        <h2 className="text-lg md:text-xl font-semibold text-white truncate">
          {title}
        </h2>
      </div>

      {/* Right Section: Profile */}
      <div className="flex items-center justify-end flex-1 min-w-0">
        <ProfileHeader />
      </div>
    </div>
  );
};

export default PageHeader;

