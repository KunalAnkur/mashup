"use client";
import { SourceSelection } from "@/components";
import HeroBanner from "@/components/Onboard/HeroBanner";
import GamesPreviewSection from "@/components/Onboard/GamesPreviewSection";
import ForYouTwoPanel from "@/components/Onboard/ForYouTwoPanel";
import { dashHomeGridClass, dashHomeMainColClass, dashHomeRailColClass } from "@/components/UI/classTokens";

const Page = () => (
  <div className={dashHomeGridClass}>
    <div className={dashHomeMainColClass}>
      <HeroBanner />
      <SourceSelection />
      <GamesPreviewSection />
    </div>
    <div className={dashHomeRailColClass}>
      <ForYouTwoPanel />
    </div>
  </div>
);

export default Page;
