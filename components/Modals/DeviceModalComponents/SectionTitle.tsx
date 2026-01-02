import React from "react";

interface SectionTitleProps {
  gradientFrom: string;
  gradientTo: string;
  title: string;
}

export const SectionTitle: React.FC<SectionTitleProps> = ({
  gradientFrom,
  gradientTo,
  title,
}) => (
  <div className="flex items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4 md:mb-5 lg:mb-6">
    <span
      className={`w-0.5 sm:w-1 h-4 sm:h-5 md:h-6 bg-gradient-to-b ${gradientFrom} ${gradientTo} rounded-full`}
    ></span>
    <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-white font-parkinsans">
      {title}
    </h3>
  </div>
);

