"use client";
import { useState } from "react";
import { LoginContainer, SignupContainer } from "../Container";
import { AuthHeader, Button } from "../UI";
import { useDispatch } from "react-redux";
import { changeStep } from "@/lib/store/slices/onboardSlice";
import { OnboardStep } from "@/types/storeTypes";
import * as constants from "@/constants/common";

const AuthWrapper = ({ isModel = false }: { isModel?: boolean }) => {
  const [container, setContainer] = useState<"login" | "signup">("login");
  const dispatch = useDispatch();
  const handleBack = () => {
    dispatch(changeStep(OnboardStep.SELECT_SOURCE));
  };
  return (
    <div className="flex flex-col items-center justify-center w-full h-full px-8 md:px-0 gap-8 bg-[#18181b] ">
      <AuthHeader
        title={
          `/${container}` === constants.pageType.signup
            ? "Signup to start watching"
            : "Welcome again!"
        }
      />
      <div className="w-full max-w-md">
        {container === "login" && (
          <LoginContainer setContainer={setContainer} />
        )}
        {container === "signup" && (
          <SignupContainer setContainer={setContainer} />
        )}
      </div>
      {!isModel && (
        <Button
          onClick={handleBack}
          className="self-center w-full rounded-lg flex items-center justify-center max-w-md gap-2 bg-zinc-800 text-gray-100 px-4 hover:bg-red-800 transition-colors"
          name="Cancel"
        ></Button>
      )}
    </div>
  );
};

export default AuthWrapper;
