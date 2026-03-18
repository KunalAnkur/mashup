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
import { trackLogin, trackSignup } from "@/lib/analytics";
import { useTranslations } from "@/i18n/I18nProvider";

type LoginDropdownProps = {
  onClose?: () => void;
};

const LoginDropdown = ({ onClose }: LoginDropdownProps) => {
  const dispatch = useDispatch();
  const [authProvider] = useAuthProviderMutation();
  const [continueAsGuest, { isLoading: isGuestLoading }] = useContinueAsGuestMutation();
  const [isGuestProcessing, setIsGuestProcessing] = useState(false);
  const tToast = useTranslations("toast");
  const tCommon = useTranslations("common");

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
      trackLogin("google");
      if (onClose) onClose();
    } catch (error) {
      console.error("Google authentication failed", error);
      showError(tToast("googleAuthFailed"), tToast("tryAgain"));
    }
  };

  const handleContinueAsGuest = async () => {
    if (isGuestProcessing || isGuestLoading) return;
    
    setIsGuestProcessing(true);
    try {
      const response = await continueAsGuest().unwrap();
      dispatch(setUser(response));
      trackSignup("guest", "home"); // Auto-detects external source (reddit, tiktok, etc.) or falls back to "home"
      showSuccess(tToast("welcomeGuest"));
      if (onClose) onClose();
    } catch (error: any) {
      console.error("Guest signup failed:", error);
      const errorMessage =
        error && typeof error === "object"
          ? "data" in error &&
            error.data &&
            typeof error.data === "object" &&
            "message" in error.data &&
            typeof error.data.message === "string"
            ? error.data.message
            : "message" in error && typeof error.message === "string"
              ? error.message
              : tToast("unableToContinueAsGuest")
          : tToast("unableToContinueAsGuest");
      showError(tToast("guestSignupFailed"), errorMessage);
    } finally {
      setIsGuestProcessing(false);
    }
  };

  return (
    <div className="border border-zinc-600/10 absolute -top-2 right-0 mt-2 w-[300px] bg-gradient-to-br from-zinc-800/5 via-zinc-700/5 to-zinc-800/5 backdrop-blur-2xl rounded-xl p-4 shadow-lg">
      <div className="flex flex-col gap-3">
        {/* Google Button */}
        <GoogleButton
          name={tCommon("continueWithGoogle")}
          onSuccess={handleGoogleAuthSuccess}
          onError={() => {
            console.log("Google authentication failed");
          }}
        />

        {/* Separator */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-px bg-zinc-600/15"></div>
          <span className="text-xs text-white/50">{tCommon("or")}</span>
          <div className="flex-1 h-px bg-zinc-600/15"></div>
        </div>

        {/* Continue as Guest Button */}
        <Button
          name={isGuestProcessing || isGuestLoading ? tCommon("creatingAccount") : tCommon("continueAsGuest")}
          icon={isGuestProcessing || isGuestLoading ? <ImSpinner2 className="animate-spin" /> : undefined}
          className="w-full py-3 rounded-xl bg-gradient-to-br from-zinc-800/5 via-zinc-700/5 to-zinc-800/5 backdrop-blur-xl border border-zinc-600/10 hover:from-purple-600/15 hover:via-pink-600/15 hover:to-fuchsia-600/15 hover:border-purple-500/25 text-white text-sm px-4 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleContinueAsGuest}
          disabled={isGuestProcessing || isGuestLoading}
        />
      </div>
    </div>
  );
};

export default LoginDropdown;
