"use client";
import { useState } from "react";
import { Input, Button, Separator, Anchor } from "../UI";
import * as constants from "@/constants/common";
import { FcGoogle } from "react-icons/fc";
const LoginContainer = () => {
  const [showPassword, setShowPassword] = useState(false);

  const handleTogglePassword = () => {
    setShowPassword((prevState) => !prevState);
    console.log("toggle func is clicked");
  };

  return (
    <div className="flex flex-col gap-4">
      <Input
        placeholder="Enter your email address"
        label="Email"
        type="email"
        style="auth"
        isChecked={false}
      />
      <Input
        placeholder="Enter your password"
        label="Password"
        type="password"
        isPassword={true}
        showPassword={showPassword}
        style="auth"
        onTogglePassword={handleTogglePassword}
      />
      <div className="flex flex-col gap-4">
        <Button
          name={"Login"}
          style="secondary"
          className="w-full py-3 bg-logoColor "
        />
        <div className="flex gap-1 items-center justify-center opacity-50 text-xs">
          <Separator />
          <span>or</span>
          <Separator />
        </div>
        <Button
          name={"Login with Google"}
          style="general"
          className="w-full py-3 border border-white/40 text-smoothWhite hover:bg-white/40"
          icon={<FcGoogle size={20} />}
        />
        <div className=" ">
          <span className="flex items-center justify-center font-semibold text-xs ">
            New on movmash?{" "}
            <Anchor
              name="SIGNUP NOW"
              url={constants.pageType.signup}
              className=" m-0 p-0 text-purple-500"
            />
          </span>
        </div>
      </div>
    </div>
  );
};

export default LoginContainer;
