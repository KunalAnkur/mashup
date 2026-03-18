"use client";
import { useState } from "react";
import { Button, Anchor, Input } from "../UI";
import * as constants from "@/constants/common";
import {
  useAuthProviderMutation,
  useSignupMutation,
} from "@/lib/store/api/authApi";
import { setUser, setGoogleUser } from "@/lib/store/slices/authSlice";
import { useDispatch } from "react-redux";
import GoogleButton from "../GoogleAuth/GoogleButton";
import { useRouter, useSearchParams } from "next/navigation";
import { IoEye, IoEyeOff } from "react-icons/io5";
import { ImSpinner2 } from "react-icons/im";
import { showError } from "@/utils/toast";
import { useTranslations } from "@/i18n/I18nProvider";
import { trackSignup } from "@/lib/analytics";
import {
  appIconTextHoverClass,
  appInputRadiusClass,
  appInputVerticalPaddingClass,
  appSeparatorLineClass,
  appWhiteBorderClass,
  movmashElevatedShadowClass,
  movmashGradientStopsClass,
} from "@/components/UI/classTokens";

type Prop = {
  setContainer?: (container: "login" | "signup") => void;
};

type GoogleAuthUserInfo = {
  email: string;
  name: string;
  picture: string;
  sub: string;
};

const signupInputBaseClass =
  `w-full ${appInputRadiusClass} bg-white/5 ${appWhiteBorderClass} text-white text-sm px-4 ${appInputVerticalPaddingClass} focus:outline-none focus:border-pink-500/50 transition-all duration-200 placeholder:text-gray-500`;

const SignupContainer = ({ setContainer }: Prop) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams?.get("redirect");

  const buildAuthRoute = (path: string) =>
    redirectParam ? `${path}?redirect=${encodeURIComponent(redirectParam)}` : path;
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [authProvider] = useAuthProviderMutation();
  const [showPassword, setShowPassword] = useState(false);
  const tToast = useTranslations("toast");

  const [signupUser, signupState] = useSignupMutation();
  const dispatch = useDispatch();
  const handleOnSignUp = async () => {
    try {
      // Use username as name for regular signup
      const data = await signupUser({
        email,
        password,
        confirmPassword: password,
        username,
        name: username, // Include name field (using username as name)
      }).unwrap();
      dispatch(setUser(data));
      trackSignup("email", "direct"); // Email signup from signup page
      console.log(data, signupState);
    } catch (error: unknown) {
      // console.error("Signup failed:", error);
      const hasSpecificSignupError =
        error &&
        typeof error === "object" &&
        (("data" in error &&
          error.data &&
          typeof error.data === "object" &&
          "message" in error.data &&
          typeof error.data.message === "string") ||
          ("message" in error && typeof error.message === "string"));
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
              : "Failed to create account"
          : "Failed to create account";
      const errorDescription = hasSpecificSignupError
        ? "Please check your information and try again."
        : "Please check your email, username, and password, then try again.";
      showError(errorMessage, errorDescription);
    }
  };

  const handleTogglePassword = () => {
    setShowPassword((prevState) => !prevState);
    console.log("toggle func is clicked");
  };

  const handleOnLoginClick = () => {
    if (setContainer) {
      setContainer("login");
    } else {
      router.push(buildAuthRoute("/login"));
    }
  };

  const handleGoogleAuthSuccess = async (userInfo: GoogleAuthUserInfo) => {
    try {
      const response = await authProvider({
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture,
        sub: userInfo.sub,
        provider_name: "google",
      }).unwrap();

      // Set the user with backend response
      dispatch(setUser(response));

      // Update with Google OAuth specific data (profile picture, name)
      dispatch(
        setGoogleUser({
          profilePicture: userInfo.picture,
          name: userInfo.name,
          email: userInfo.email,
        })
      );
      trackSignup("google", "direct"); // Google signup from signup page
    } catch (error) {
      console.error("Google authentication failed", error);
      showError(tToast("googleAuthFailed"), tToast("tryAgain"));
    }
  };

  return (
    <div className="bg-gradient-to-br from-[#1f1f23] to-[#27272a] rounded-2xl p-6 md:p-8 shadow-xl w-full">
      <div className="flex flex-col gap-5">
        {/* Username Input */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-300">Username</label>
          <Input
            variant="raw"
            type="text"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className={signupInputBaseClass}
          />
        </div>

        {/* Email Input */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-300">Email</label>
          <Input
            variant="raw"
            type="email"
            placeholder="Enter your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={signupInputBaseClass}
          />
        </div>

        {/* Password Input */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-300">Password</label>
          <div className="relative">
            <Input
              variant="raw"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${signupInputBaseClass} pr-12`}
            />
            <button
              type="button"
              onClick={handleTogglePassword}
              className={`absolute right-3 top-1/2 -translate-y-1/2 ${appIconTextHoverClass}`}
            >
              {showPassword ? (
                <IoEye size={20} />
              ) : (
                <IoEyeOff size={20} />
              )}
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-4 pt-2">
          <Button
            name={signupState.isLoading ? "Signing up..." : "Signup"}
            icon={signupState.isLoading ? <ImSpinner2 className="animate-spin" /> : undefined}
            className={`w-full bg-gradient-to-r ${movmashGradientStopsClass} ${movmashElevatedShadowClass} text-white font-semibold text-sm px-6 py-3 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}
            onClick={handleOnSignUp}
            disabled={signupState.isLoading}
          />
          
          {/* Separator */}
          <div className="flex items-center gap-3">
            <div className={appSeparatorLineClass}></div>
            <span className="text-xs text-gray-500">or</span>
            <div className={appSeparatorLineClass}></div>
          </div>

          {/* Google Button */}
          <GoogleButton
            name="Continue with Google"
            onSuccess={handleGoogleAuthSuccess}
            onError={() => {
              console.log("Google authentication failed");
              // Handle authentication failure, e.g., show a notification
            }}
          />

          {/* Login Link */}
          <div className="pt-2">
            <span className="flex items-center justify-center text-sm text-gray-400">
              Already have an account?{" "}
              {!!setContainer ? (
                <button
                  onClick={handleOnLoginClick}
                  className="ml-1 text-pink-500 hover:text-pink-400 font-semibold transition-colors"
                >
                  LOGIN
                </button>
              ) : (
                <Anchor
                  name="LOGIN"
                  url={buildAuthRoute(constants.pageType.login)}
                  className="ml-1 text-pink-500 hover:text-pink-400 font-semibold transition-colors"
                />
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupContainer;
