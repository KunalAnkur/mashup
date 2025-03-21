"use client";
import { AuthHeader, Button } from "@/components";
import React from "react";
import { usePathname } from "next/navigation";

import * as constants from "@/constants/common";
const Layout = ({ children }: { children: React.ReactNode }) => {
  const componentType = usePathname();
  return (
    <div className="max-w-md mx-auto flex flex-col h-screen justify-center gap-8 px-3">
      <AuthHeader
        title={
          componentType === constants.pageType.signup
            ? "Signup to start watching"
            : "Welcome again!"
        }
      />
      {children}
      <Button
        onClick={() => console.log("continue as guest button is clicked.")}
        name="Continue as guest."
        className="text-xs p-0 m-0 w-fit mx-auto font-medium underline underline-offset-2 hover:text-white"
      />
    </div>
  );
};

export default Layout;
