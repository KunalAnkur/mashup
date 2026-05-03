"use client";
import { appMutedHoverSurfaceClass } from "@/components/UI/classTokens";
import { ReactNode } from "react";
import { useGoogleLogin } from "@react-oauth/google";
import { Button } from "../UI";
import { FcGoogle } from "react-icons/fc";
import axios from "axios";

export type GoogleAuthUserInfo = {
  email: string;
  name: string;
  picture: string;
  sub: string;
};

type Props = {
  name: string;
  className?: string;
  icon?: ReactNode;
  disabled?: boolean;
  onSuccess: (userInfo: GoogleAuthUserInfo) => void | Promise<void>;
  onError?: () => void;
};

const GoogleButton = ({
  onSuccess,
  onError,
  name,
  className = "",
  icon,
  disabled = false,
}: Props) => {
  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      const userInfo = await axios
        .get<GoogleAuthUserInfo>("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
      await onSuccess(userInfo.data);
    },
    onError: onError,
  });

  return (
    <Button
      name={name}
      className={`w-full rounded-xl py-3 text-sm font-medium text-gray-300 transition-all duration-200 ${appMutedHoverSurfaceClass} ${className}`}
      icon={icon ?? <FcGoogle size={20} />}
      onClick={() => {
        if (!disabled) {
          login();
        }
      }}
      disabled={disabled}
    />
  );
};

export default GoogleButton;
