"use client";
import { AuthHeader } from "@/components";
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
      {/* <div className="flex flex-col gap-4">
        <Button
          name={
            componentType === constants.pageType.signup ? "Signup" : "Login"
          }
          style="secondary"
          className="w-full py-3"
        />
        <div className="flex gap-1 items-center justify-center opacity-50 text-xs">
          <Separator />
          <span>or</span>
          <Separator />
        </div>
        <Button
          name={
            componentType === constants.pageType.signup
              ? "Signup with Google"
              : "Login with Google"
          }
          style="general"
          className="w-full py-3 border border-white/40 text-smoothWhite hover:bg-white/40"
          icon={<FcGoogle size={20} />}
        />
        <div className=" ">
          {componentType === constants.pageType.signup ? (
            <span className="flex items-center justify-center font-semibold gap-1 text-xs">
              Already have an account?{" "}
              <Anchor
                style={"general"}
                name="Login"
                url={constants.pageType.login}
                className=" text-purple-500 p-0 m-0 text-sm"
              />
            </span>
          ) : (
            <span className="flex items-center justify-center font-semibold text-xs gap-1">
              New on movmash?{" "}
              <Anchor
                name="Signup"
                url={constants.pageType.signup}
                className=" m-0 p-0 text-purple-500"
              />
            </span>
          )}
        </div>
      </div> */}
    </div>
  );
};

export default Layout;
