"use client";

import { HomeContent } from "@/components/Container";
import { Sidebar } from "../components";

const Page = () => {
  return (
    <div className=" h-screen flex items-center justify-center gap-4">
      <Sidebar />

      <HomeContent />
    </div>
  );
};

export default Page;
