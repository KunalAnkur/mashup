"use client";
import { useState } from "react";
import { Button } from "../UI";
import GoogleButton from "../GoogleAuth/GoogleButton";
import {
  useAuthProviderMutation,
  useContinueAsGuestMutation,
} from "@/lib/store/api/authApi";
import { setUser, setGoogleUser } from "@/lib/store/slices/authSlice";
import { useDispatch } from "react-redux";
import { ImSpinner2 } from "react-icons/im";
import { showError, showSuccess } from "@/utils/toast";

type LoginDropdownProps = {
  onClose?: () => void;
};

const LoginDropdown = ({ onClose }: LoginDropdownProps) => {
  const dispatch = useDispatch();
  const [authProvider] = useAuthProviderMutation();
  const [continueAsGuest, { isLoading: isGuestLoading }] = useContinueAsGuestMutation();
  const [isGuestProcessing, setIsGuestProcessing] = useState(false);

  const handleGoogleAuthSuccess = async (userInfo: any) => {
    try {
      const response = await authProvider({
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture,
        sub: userInfo.sub,
        provider_name: "google",
      }).unwrap();

      dispatch(setUser(response));
      dispatch(
        setGoogleUser({
          profilePicture: userInfo.picture,
          name: userInfo.name,
          email: userInfo.email,
        })
      );
      if (onClose) onClose();
    } catch (error) {
      console.error("Google authentication failed", error);
      showError("Google authentication failed", "Please try again.");
    }
  };

  const handleContinueAsGuest = async () => {
    if (isGuestProcessing || isGuestLoading) return;
    
    setIsGuestProcessing(true);
    try {
      const response = await continueAsGuest().unwrap();
      dispatch(setUser(response));
      showSuccess("Welcome! You're now signed in as a guest");
      if (onClose) onClose();
    } catch (error: any) {
      console.error("Guest signup failed:", error);
      const errorMessage = error?.data?.message || error?.message || "Failed to continue as guest";
      showError("Guest signup failed", errorMessage);
    } finally {
      setIsGuestProcessing(false);
    }
  };

  return (
    <div className="border border-white/10 absolute top-0 right-0 mt-2 w-[300px] bg-[#1f1f23] rounded-lg p-3">
      <div className="flex flex-col gap-3">
        {/* Google Button */}
        <GoogleButton
          name="Continue with Google"
          onSuccess={handleGoogleAuthSuccess}
          onError={() => {
            console.log("Google authentication failed");
          }}
        />

        {/* Separator */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-px bg-white/10"></div>
          <span className="text-xs text-gray-400">or</span>
          <div className="flex-1 h-px bg-white/10"></div>
        </div>

        {/* Continue as Guest Button */}
        <Button
          name={isGuestProcessing || isGuestLoading ? "Creating account..." : "Continue as Guest"}
          icon={isGuestProcessing || isGuestLoading ? <ImSpinner2 className="animate-spin" /> : undefined}
          className="w-full py-3 rounded-xl bg-white/5 text-gray-300 text-sm px-4 hover:bg-white/10 hover:text-white transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleContinueAsGuest}
          disabled={isGuestProcessing || isGuestLoading}
        />
      </div>
    </div>
  );
};

export default LoginDropdown;

