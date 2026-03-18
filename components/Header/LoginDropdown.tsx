"use client";
import { useState } from "react";
import {
  useAuthProviderMutation,
  useContinueAsGuestMutation,
} from "@/lib/store/api/authApi";
import { setUser, setGoogleUser } from "@/lib/store/slices/authSlice";
import { useDispatch } from "react-redux";
import { ImSpinner2 } from "react-icons/im";
import { FcGoogle } from "react-icons/fc";
import { LuUserRound } from "react-icons/lu";
import { useGoogleLogin } from "@react-oauth/google";
import axios from "axios";
import { showError, showSuccess } from "@/utils/toast";
import { trackLogin, trackSignup } from "@/lib/analytics";
import { useTranslations } from "@/i18n/I18nProvider";
import {
  DropdownActionRow,
  DropdownDivider,
  DropdownPanel,
} from "@/components/UI/DropdownPrimitives";
import {
  appDropdownDisabledRowClass,
  appDropdownGoogleIconChipClass,
  appDropdownGuestIconChipClass,
} from "@/components/UI/classTokens";

type LoginDropdownProps = {
  onClose?: () => void;
  id?: string;
  ariaLabel?: string;
};

type GoogleAuthUserInfo = {
  email: string;
  name: string;
  picture: string;
  sub: string;
};

const LoginDropdown = ({ onClose, id, ariaLabel }: LoginDropdownProps) => {
  const dispatch = useDispatch();
  const [authProvider] = useAuthProviderMutation();
  const [continueAsGuest, { isLoading: isGuestLoading }] =
    useContinueAsGuestMutation();
  const [isGuestProcessing, setIsGuestProcessing] = useState(false);
  const tToast = useTranslations("toast");
  const tCommon = useTranslations("common");

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      const userInfo = await axios.get(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        }
      );
      handleGoogleAuthSuccess(userInfo.data);
    },
    onError: () => {
      console.log("Google authentication failed");
    },
  });

  const handleGoogleAuthSuccess = async (userInfo: GoogleAuthUserInfo) => {
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
      showError("Google authentication failed", "Please try again.");
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
    } catch (error) {
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
              : "Failed to continue as guest"
          : "Failed to continue as guest";
      showError("Guest signup failed", errorMessage);
    } finally {
      setIsGuestProcessing(false);
    }
  };

  const panelAriaLabel = ariaLabel ?? tCommon("login");

  return (
    <DropdownPanel id={id} role="menu" aria-label={panelAriaLabel} className="z-50">
        {/* Google Button */}
        <DropdownActionRow
          role="menuitem"
          onClick={() => googleLogin()}
          iconChipClassName={appDropdownGoogleIconChipClass}
          icon={<FcGoogle size={16} />}
          label={tCommon("continueWithGoogle")}
        />

        <DropdownDivider />

        {/* Continue as Guest Button */}
        <DropdownActionRow
          role="menuitem"
          className={appDropdownDisabledRowClass}
          onClick={handleContinueAsGuest}
          disabled={isGuestProcessing || isGuestLoading}
          iconChipClassName={appDropdownGuestIconChipClass}
          icon={
            isGuestProcessing || isGuestLoading ? (
              <ImSpinner2 className="animate-spin" size={14} />
            ) : (
              <LuUserRound size={14} />
            )
          }
          label={
            isGuestProcessing || isGuestLoading
              ? tCommon("creatingAccount")
              : tCommon("continueAsGuest")
          }
        />
    </DropdownPanel>
  );
};

export default LoginDropdown;
