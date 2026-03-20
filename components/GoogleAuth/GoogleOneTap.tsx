"use client";
import { useEffect, useState } from "react";
import { useGoogleOneTapLogin } from "@react-oauth/google";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import { useAuthProviderMutation } from "@/lib/store/api/authApi";
import { setUser, setGoogleUser } from "@/lib/store/slices/authSlice";
import { showError, showSuccess } from "@/utils/toast";
import { trackLogin } from "@/lib/analytics";
import { useTranslations } from "@/i18n/I18nProvider";

const GoogleOneTap = () => {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const [authProvider] = useAuthProviderMutation();
  const tToast = useTranslations("toast");

  const handleOneTapSuccess = async (credentialResponse: any) => {
    try {
      console.log("✅ Google One Tap success!");
      
      const credential = credentialResponse.credential;
      
      if (!credential) {
        throw new Error("No credential received");
      }
      
      // Decode JWT
      const base64Url = credential.split('.')[1];
      if (!base64Url) {
        throw new Error("Invalid credential format");
      }
      
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const userInfo = JSON.parse(jsonPayload);

      console.log("User info decoded:", { 
        email: userInfo.email, 
        name: userInfo.name 
      });

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

      trackLogin("google_one_tap");
      showSuccess(tToast("loginSuccessful"));
    } catch (error: any) {
      console.error("❌ Google One Tap authentication failed:", error);
      const errorMessage = error?.data?.message || tToast("tryAgain");
      showError(tToast("authenticationFailed"), errorMessage);
    }
  };

  const handleOneTapError = () => {
    showError(tToast("authenticationFailed"));
  };

  useGoogleOneTapLogin({
    onSuccess: handleOneTapSuccess,
    onError: handleOneTapError,
    disabled: isAuthenticated,
    auto_select: false,
    cancel_on_tap_outside: false,
  });

  return null;
};

export default GoogleOneTap;
