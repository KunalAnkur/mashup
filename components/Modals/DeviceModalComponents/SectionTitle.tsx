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
  <div className="flex items-center gap-2 mb-6">
    <span
      className={`w-1 h-6 bg-gradient-to-b ${gradientFrom} ${gradientTo} rounded-full`}
    ></span>
    <h3 className="text-lg md:text-xl font-bold text-white font-parkinsans">
      {title}
    </h3>
  </div>
);

