"use client";
import { useState } from "react";
import { LoginContainer, SignupContainer } from "../Container";
import { Button } from "../UI";
import { useDispatch } from "react-redux";
import { changeStep } from "@/lib/store/slices/onboardSlice";
import { OnboardStep } from "@/types/storeTypes";

const AuthWrapper = ({ isModel = false }: { isModel?: boolean }) => {
  const [container, setContainer] = useState<"login" | "signup">("login");
  const dispatch = useDispatch();
  const handleBack = () => {
    dispatch(changeStep(OnboardStep.SELECT_SOURCE));
  };
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-8 px-8 md:px-0">
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
