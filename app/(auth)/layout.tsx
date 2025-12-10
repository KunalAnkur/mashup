"use client";
import React from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import * as constants from "@/constants/common";

const Layout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const isSignup = pathname === constants.pageType.signup;
  const title = isSignup ? "Signup to start watching" : "Welcome again!";

  return (
    <div className="relative w-full h-full bg-[#18181b] flex flex-col items-center justify-center overflow-hidden min-h-screen px-4 py-8">
      <div className="w-full max-w-md flex flex-col items-center gap-8">
        {/* Logo and Title
        <header className="flex flex-col items-center justify-center gap-4">
          <Image src="/assets/logo.svg" alt="logo" width={70} height={70} />
          <h3 className="text-2xl font-extrabold text-white text-center font-parkinsans tracking-tight -mt-2">Movmash</h3>
          <h1 className="text-3xl text-center font-bold text-white">{title}</h1>
        </header> */}

        {/* Auth content */}
        <div className="w-full">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Layout;
