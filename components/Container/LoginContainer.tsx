"use client";
import { useState } from "react";
import { Button, Anchor } from "../UI";
import GoogleButton from "../GoogleAuth/GoogleButton";
import * as constants from "@/constants/common";
import {
  useLoginMutation,
  useAuthProviderMutation,
} from "@/lib/store/api/authApi";
import { setUser, setGoogleUser } from "@/lib/store/slices/authSlice";
import { useDispatch } from "react-redux";
import { useRouter, useSearchParams } from "next/navigation";
import { IoEye, IoEyeOff } from "react-icons/io5";
import { showError } from "@/utils/toast";

type Prop = {
  setContainer?: (container: "login" | "signup") => void | null;
  isModel?: boolean; // Optional prop to indicate if it's a modal
};
const LoginContainer = ({ setContainer }: Prop) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams?.get("redirect");

  const buildAuthRoute = (path: string) =>
    redirectParam ? `${path}?redirect=${encodeURIComponent(redirectParam)}` : path;
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loginUser, loginState] = useLoginMutation();
  const [authProvider] = useAuthProviderMutation();
  const dispatch = useDispatch();
  const handleTogglePassword = () => {
    setShowPassword((prevState) => !prevState);
    console.log("toggle func is clicked");
  };

  const handleLogin = async () => {
    try {
      const response = await loginUser({ email, password }).unwrap();
      console.log(response.data, loginState);
      dispatch(setUser(response));
    } catch (error: any) {
      // console.error("Login failed:", error);
      const errorMessage = error?.data?.message || error?.message || "Invalid credentials";
      const errorDescription = error?.data?.message || error?.message 
        ? "Please check your email or password and try again."
        : "Please check your email or password.";
      showError(errorMessage, errorDescription);
    }
  };

  const handleGoogleAuthSuccess = async (userInfo: any) => {
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
    } catch (error) {
      console.error("Google authentication failed", error);
      showError("Google authentication failed", "Please try again or use email and password to login.");
    }
  };

  const handleOnEmailChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setEmail(e.target.value);
  const handleOnPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setPassword(e.target.value);
  const handleOnSignupClick = () => {
    if (setContainer) {
      setContainer("signup");
    } else {
      router.push(buildAuthRoute("/signup"));
    }
  };
  return (
    <div className="bg-gradient-to-br from-[#1f1f23] to-[#27272a] rounded-2xl p-6 md:p-8 shadow-xl w-full">
      <div className="flex flex-col gap-5">
        {/* Email Input */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-300">Email</label>
          <input
            type="email"
            placeholder="Enter your email address"
            value={email}
            onChange={handleOnEmailChange}
            className="w-full rounded-xl bg-white/5 text-white text-sm px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500/50 transition-all duration-200 placeholder:text-gray-500 border border-white/10"
          />
        </div>

        {/* Password Input */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-300">Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={handleOnPasswordChange}
              className="w-full rounded-xl bg-white/5 text-white text-sm px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500/50 transition-all duration-200 placeholder:text-gray-500 border border-white/10"
            />
            <button
              type="button"
              onClick={handleTogglePassword}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
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
            name={"Login"}
            className="w-full bg-gradient-to-r from-rose-600 via-pink-600 to-fuchsia-600 hover:from-rose-500 hover:via-pink-500 hover:to-fuchsia-500 text-white font-semibold text-sm px-6 py-3 rounded-xl transition-all duration-200 shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40"
            onClick={handleLogin}
          />
          
          {/* Separator */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-white/10"></div>
            <span className="text-xs text-gray-500">or</span>
            <div className="flex-1 h-px bg-white/10"></div>
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

          {/* Signup Link */}
          <div className="pt-2">
            <span className="flex items-center justify-center text-sm text-gray-400">
              New on movmash?{" "}
              {!!setContainer ? (
                <button
                  onClick={handleOnSignupClick}
                  className="ml-1 text-pink-500 hover:text-pink-400 font-semibold transition-colors"
                >
                  SIGNUP NOW
                </button>
              ) : (
                <Anchor
                  name="SIGNUP NOW"
                  url={buildAuthRoute(constants.pageType.signup)}
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

export default LoginContainer;
