"use client";
import { useState } from "react";
import { Button, Anchor } from "../UI";
import * as constants from "@/constants/common";
import {
  useAuthProviderMutation,
  useSignupMutation,
} from "@/lib/store/api/authApi";
import { setUser, setGoogleUser } from "@/lib/store/slices/authSlice";
import { useDispatch } from "react-redux";
import GoogleButton from "../GoogleAuth/GoogleButton";
import { useRouter } from "next/navigation";
import { IoEye, IoEyeOff } from "react-icons/io5";

type Prop = {
  setContainer?: (container: "login" | "signup") => void;
};
const SignupContainer = ({ setContainer }: Prop) => {
  const router = useRouter();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [authProvider] = useAuthProviderMutation();
  const [showPassword, setShowPassword] = useState(false);

  const [signupUser, signupState] = useSignupMutation();
  const dispatch = useDispatch();
  const handleOnSignUp = async () => {
    // Use username as name for regular signup
    const data = await signupUser({
      email,
      password,
      confirmPassword: password,
      username,
      name: username, // Include name field (using username as name)
    }).unwrap();
    dispatch(setUser(data));
    console.log(data, signupState);
  };

  const handleTogglePassword = () => {
    setShowPassword((prevState) => !prevState);
    console.log("toggle func is clicked");
  };

  const handleOnLoginClick = () => {
    if (setContainer) {
      setContainer("login");
    } else {
      router.push("/login");
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
    }
  };

  return (
    <div className="bg-gradient-to-br from-[#1f1f23] to-[#27272a] rounded-2xl p-6 md:p-8 shadow-xl w-full">
      <div className="flex flex-col gap-5">
        {/* Username Input */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-300">Username</label>
          <input
            type="text"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded-xl bg-white/5 text-white text-sm px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500/50 transition-all duration-200 placeholder:text-gray-500 border border-white/10"
          />
        </div>

        {/* Email Input */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-300">Email</label>
          <input
            type="email"
            placeholder="Enter your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
              onChange={(e) => setPassword(e.target.value)}
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
            name={"Signup"}
            className="w-full bg-gradient-to-r from-rose-600 via-pink-600 to-fuchsia-600 hover:from-rose-500 hover:via-pink-500 hover:to-fuchsia-500 text-white font-semibold text-sm px-6 py-3 rounded-xl transition-all duration-200 shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40"
            onClick={handleOnSignUp}
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
                  url={constants.pageType.login}
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
