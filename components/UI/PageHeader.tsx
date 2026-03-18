"use client";
import React from "react";
import { Logo, ProfileHeader } from "@/components";
import { FaArrowLeft } from "react-icons/fa";

type PageHeaderProps = {
  title: string;
  onBack: () => void;
  logoGap?: "gap-4" | "gap-8";
};

const pageHeaderRootClass =
  "w-full flex items-center justify-between px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 md:py-4 border-b border-white/10 relative z-40 flex-shrink-0";
const pageHeaderBackButtonClass =
  "flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-white/5 hover:bg-white/10 active:bg-white/15 text-gray-300 hover:text-white transition-all duration-200 flex-shrink-0 group";
const pageHeaderDividerClass =
  "h-4 sm:h-5 w-px bg-white/10 flex-shrink-0 hidden sm:block";

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  onBack,
  logoGap = "gap-4",
}) => {
  return (
    <div className={pageHeaderRootClass}>
      {/* Left Section: Back Button + Logo */}
      <div
        className="flex items-center gap-2 sm:gap-3 md:gap-5 min-w-0"
        data-logo-gap={logoGap}
      >
        <button
          onClick={onBack}
          className={pageHeaderBackButtonClass}
          aria-label="Go back"
        >
          <FaArrowLeft className="text-sm sm:text-base group-hover:-translate-x-0.5 transition-transform duration-200" />
        </button>
        <div className={pageHeaderDividerClass}></div>
        <div className="flex items-center flex-shrink-0 hidden sm:flex">
          <Logo size="sm" href="/" showText={true} />
        </div>
      </div>

      {/* Center Section: Title */}
      <div className="flex-1 flex justify-center items-center px-2 sm:px-4">
        <h2 className="text-sm sm:text-base md:text-lg lg:text-xl font-semibold text-white truncate">
          {title}
        </h2>
      </div>

      {/* Right Section: Profile */}
      <div className="flex items-center justify-end min-w-0">
        <ProfileHeader />
      </div>
    </div>
  );
};

export default PageHeader;
