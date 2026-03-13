"use client";
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
  const isLocalOrigin =
    typeof window !== "undefined" &&
    ["localhost", "127.0.0.1"].includes(window.location.hostname);
  const isOneTapEnabled =
    process.env.NEXT_PUBLIC_ENABLE_GOOGLE_ONE_TAP === "true" && !isLocalOrigin;

  const handleOneTapSuccess = async (credentialResponse: { credential?: string }) => {
    try {
      const credential = credentialResponse.credential;

      if (!credential) {
        throw new Error("No credential received");
      }

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
    } catch (error: unknown) {
      const errorMessage =
        typeof error === "object" &&
        error !== null &&
        "data" in error &&
        typeof (error as { data?: { message?: string } }).data?.message === "string"
          ? (error as { data?: { message?: string } }).data?.message || tToast("authenticationFailed")
          : typeof error === "object" &&
              error !== null &&
              "message" in error &&
              typeof (error as { message?: string }).message === "string"
            ? (error as { message?: string }).message || tToast("authenticationFailed")
            : tToast("authenticationFailed");
      showError(tToast("authenticationFailed"), errorMessage);
    }
  };

  const handleOneTapError = () => {
    // Ignore prompt-level failures. These are commonly caused by FedCM/privacy
    // restrictions or OAuth origin configuration and should not break the app UI.
  };

  useGoogleOneTapLogin({
    onSuccess: handleOneTapSuccess,
    onError: handleOneTapError,
    disabled: isAuthenticated || !isOneTapEnabled,
    auto_select: false,
    cancel_on_tap_outside: false,
    use_fedcm_for_prompt: false,
  });

  return null;
};

export default GoogleOneTap;
