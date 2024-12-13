"use client";

import { HomeContent } from "@/components/Container";
import { Sidebar } from "../components";

const Page = () => {
  return (
    <div className="  p-4 h-screen flex items-center justify-center gap-8">
      <Sidebar />

      <HomeContent />
    </div>
  );
};

export default Page;
