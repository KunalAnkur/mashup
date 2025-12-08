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
    <div className="w-full flex items-center justify-between p-4 md:p-6 border-b border-white/10 relative z-40">
      <div className={`flex items-center ${logoGap}`}>
        <div className="flex items-center">
          <Logo size="sm" href="/" showText={true} />
        </div>
        <button
          onClick={onBack}
          className="flex items-center text-gray-400 hover:text-white transition-colors"
        >
          <FaArrowLeft className="text-lg" />
        </button>
      </div>
      <h2 className="text-xl font-bold text-white absolute left-1/2 -translate-x-1/2">
        {title}
      </h2>
      <div className="flex items-center">
        <ProfileHeader />
      </div>
    </div>
  );
};

export default PageHeader;

