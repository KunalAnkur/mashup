"use client";
import { Fragment, useState } from "react";
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
  panelClassName?: string;
  compact?: boolean;
};

type GoogleAuthUserInfo = {
  email: string;
  name: string;
  picture: string;
  sub: string;
};

const LoginDropdown = ({ onClose, id, ariaLabel, panelClassName, compact = false }: LoginDropdownProps) => {
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
              : tToast("unableToContinueAsGuest")
          : tToast("unableToContinueAsGuest");
      showError(tToast("guestSignupFailed"), errorMessage);
    } finally {
      setIsGuestProcessing(false);
    }
  };

  const panelAriaLabel = ariaLabel ?? tCommon("login");

  const actionItems = [
    {
      key: "google",
      onClick: () => googleLogin(),
      iconChipClassName: appDropdownGoogleIconChipClass,
      icon: <FcGoogle size={compact ? 13 : 16} />,
      label: tCommon("continueWithGoogle"),
      disabled: false,
      className: undefined,
    },
    {
      key: "guest",
      onClick: handleContinueAsGuest,
      iconChipClassName: appDropdownGuestIconChipClass,
      icon:
        isGuestProcessing || isGuestLoading ? (
          <ImSpinner2 className="animate-spin" size={compact ? 12 : 14} />
        ) : (
          <LuUserRound size={compact ? 12 : 14} />
        ),
      label:
        isGuestProcessing || isGuestLoading
          ? tCommon("creatingAccount")
          : tCommon("continueAsGuest"),
      disabled: isGuestProcessing || isGuestLoading,
      className: appDropdownDisabledRowClass,
    },
  ];

  return (
    <DropdownPanel
      id={id}
      role="menu"
      aria-label={panelAriaLabel}
      className={`z-50 ${panelClassName || ""}`}
    >
      {actionItems.map((action, index) => (
        <Fragment key={action.key}>
          {index > 0 && <DropdownDivider />}
          <DropdownActionRow
            role="menuitem"
            onClick={action.onClick}
            iconChipClassName={action.iconChipClassName}
            icon={action.icon}
            label={action.label}
            disabled={action.disabled}
            className={action.className}
            compact={compact}
          />
        </Fragment>
      ))}
      <div className="px-3 pb-3 pt-2">
        <p className="text-center text-[9px] leading-relaxed text-white/28">
          By continuing you agree to our{" "}
          <a href="https://movmash.com/terms" target="_blank" rel="noopener noreferrer" className="underline hover:text-white/50 transition-colors">
            Terms
          </a>{" "}
          &{" "}
          <a href="https://movmash.com/privacy" target="_blank" rel="noopener noreferrer" className="underline hover:text-white/50 transition-colors">
            Privacy Policy
          </a>
          .
        </p>
      </div>
    </DropdownPanel>
  );
};

export default LoginDropdown;
