"use client";
import { useState } from "react";
import { Button } from "../UI";
import GoogleButton from "../GoogleAuth/GoogleButton";
import {
  useLoginMutation,
  useAuthProviderMutation,
  useContinueAsGuestMutation,
} from "@/lib/store/api/authApi";
import { setUser, setGoogleUser } from "@/lib/store/slices/authSlice";
import { useDispatch } from "react-redux";
import { useRouter, useSearchParams } from "next/navigation";
import { ImSpinner2 } from "react-icons/im";
import { showError, showSuccess } from "@/utils/toast";
import Image from "next/image";


type Prop = {
  setContainer?: (container: "login" | "signup") => void | null;
  isModel?: boolean;
};

const LoginContainer = ({ setContainer }: Prop) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams?.get("redirect");

  const buildAuthRoute = (path: string) =>
    redirectParam ? `${path}?redirect=${encodeURIComponent(redirectParam)}` : path;

  const [loginUser, loginState] = useLoginMutation();
  const [authProvider] = useAuthProviderMutation();
  const [continueAsGuest, { isLoading: isGuestLoading }] = useContinueAsGuestMutation();
  const [isGuestProcessing, setIsGuestProcessing] = useState(false);
  const dispatch = useDispatch();

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
    } catch (error) {
      console.error("Google authentication failed", error);
      showError("Google authentication failed", "Please try again or use email and password to login.");
    }
  };

  const handleContinueAsGuest = async () => {
    if (isGuestProcessing || isGuestLoading) return;
    
    setIsGuestProcessing(true);
    try {
      const response = await continueAsGuest().unwrap();
      dispatch(setUser(response));
      showSuccess("Welcome! You're now signed in as a guest");
    } catch (error: any) {
      console.error("Guest signup failed:", error);
      const errorMessage = error?.data?.message || error?.message || "Failed to continue as guest";
      showError("Guest signup failed", errorMessage);
    } finally {
      setIsGuestProcessing(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-zinc-800/15 via-zinc-700/15 to-zinc-800/15 backdrop-blur-2xl rounded-3xl p-8 md:p-10 shadow-xl w-full max-w-md mx-auto border border-zinc-600/15">
      <div className="flex flex-col items-center gap-7">
        {/* Logo and Welcome Section */}
        <header className="flex flex-col items-center gap-4 w-full">
          {/* Logo with glow effect */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-rose-500/20 via-pink-500/20 to-fuchsia-500/20 rounded-full blur-xl animate-pulse"></div>
            <div className="relative z-10">
              <Image 
                src="/assets/logo.svg" 
                alt="Movmash Logo" 
                priority
                width={64} 
                height={64}
                className="drop-shadow-lg"
              />
            </div>
          </div>
          
          {/* Brand Name */}
          <div className="flex flex-col items-center gap-1.5">
            <h1 className="text-3xl md:text-4xl font-extrabold text-white text-center font-parkinsans tracking-tight bg-gradient-to-r from-rose-400 via-pink-400 to-fuchsia-400 bg-clip-text text-transparent">
              Movmash
            </h1>
            <p className="text-base md:text-lg text-white/90 text-center font-medium">
              Welcome back!
            </p>
            <p className="text-xs md:text-sm text-white/60 text-center max-w-xs mt-0.5">
              Choose how you'd like to continue
            </p>
          </div>
        </header>

        {/* Authentication Buttons */}
        <div className="flex flex-col gap-3.5 w-full">
          {/* Google Button */}
          <GoogleButton
            name="Continue with Google"
            onSuccess={handleGoogleAuthSuccess}
            onError={() => {
              console.log("Google authentication failed");
            }}
          />

          {/* Separator */}
          <div className="flex items-center gap-3 py-0.5">
            <div className="flex-1 h-px bg-zinc-600/20"></div>
            <span className="text-xs text-white/50 font-medium uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-zinc-600/20"></div>
          </div>

          {/* Continue as Guest Button */}
          <Button
            name={isGuestProcessing || isGuestLoading ? "Creating account..." : "Continue as Guest"}
            icon={isGuestProcessing || isGuestLoading ? <ImSpinner2 className="animate-spin" /> : undefined}
            className="w-full bg-gradient-to-br from-zinc-800/15 via-zinc-700/15 to-zinc-800/15 backdrop-blur-xl border border-zinc-600/15 hover:from-purple-600/20 hover:via-pink-600/20 hover:to-fuchsia-600/20 hover:border-purple-500/30 text-white font-semibold text-sm px-6 py-3.5 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleContinueAsGuest}
            disabled={isGuestProcessing || isGuestLoading}
          />
        </div>

        {/* Footer Note */}
        <p className="text-xs text-white/60 text-center leading-relaxed max-w-sm mt-1">
          By continuing, you agree to Movmash's{" "}
          <span className="text-white/80 hover:text-pink-400 transition-colors cursor-pointer">Terms of Service</span>
          {" "}and{" "}
          <span className="text-white/80 hover:text-pink-400 transition-colors cursor-pointer">Privacy Policy</span>
        </p>
      </div>
    </div>
  );
};

export default LoginContainer;