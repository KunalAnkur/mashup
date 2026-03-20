import React from "react";
import {
  appSectionTitleTextClass,
  appSectionTitleWrapClass,
} from "@/components/UI/classTokens";

interface SectionTitleProps {
  gradientFrom: string;
  gradientTo: string;
  title: string;
}

export const SectionTitle: React.FC<SectionTitleProps> = ({
  title,
}) => (
  <div className={appSectionTitleWrapClass}>
    <h3 className={appSectionTitleTextClass}>{title}</h3>
  </div>
);
