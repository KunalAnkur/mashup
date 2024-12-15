"use client";
import {
  AuthHeader,
  SignupContainer,
  LoginContainer,
  Button,
  Separator,
} from "@/components";
import React from "react";
import { useRouter } from "next/navigation";
import { FcGoogle } from "react-icons/fc";

const Layout = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter(); // Initialize router
  const handleOnAccount = () => {
    if (componentType === "signup") {
      router.push("/login"); // Use router.push for navigation
    } else {
      router.push("/signup");
    }
  };
  let componentType = "";
  React.Children.forEach(children, (child) => {
    if (React.isValidElement(child)) {
      if (child.type === SignupContainer) {
        componentType = "signup";
      } else if (child.type === LoginContainer) {
        componentType = "login";
      }
    }
  });

  return (
    <div className="max-w-md mx-auto flex flex-col h-screen justify-center gap-8">
      <AuthHeader
        title={
          componentType === "signup"
            ? "Signup to start watching"
            : "Welcome again!"
        }
      />
      {children}
      <div className="flex flex-col gap-4">
        <Button
          name={componentType === "signup" ? "Signup" : "Login"}
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
            componentType === "signup"
              ? "Signup with Google"
              : "Login with Google"
          }
          style="general"
          className="w-full py-3 border border-white/40 text-smoothWhite hover:bg-white/20  hover:border-none"
          icon={<FcGoogle size={20} />}
        />
        <button onClick={handleOnAccount} className="text-[10px] font-semibold">
          {componentType === "signup" ? (
            <span>
              Already have an account?{" "}
              <span className="text-purple-500">LOGIN</span>{" "}
            </span>
          ) : (
            <span>
              New to Movmash?{" "}
              <span className="text-purple-500">SIGNUP NOW</span>{" "}
            </span>
          )}
        </button>
      </div>
    </div>
  );
};

export default Layout;
