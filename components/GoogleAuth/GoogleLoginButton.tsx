"use client";
import { useGoogleLogin, TokenResponse } from "@react-oauth/google";
import { Button } from "../UI";
import { FcGoogle } from "react-icons/fc";

type Props = {
  onSuccess: (
    tokenResponse: Omit<TokenResponse, "error" | "error_description" | "error_uri">
  ) => void;
  onError?: () => void;
};

const GoogleLoginButton = ({ onSuccess, onError }: Props) => {
  const login = useGoogleLogin({
    onSuccess: (tokenResponse) => onSuccess(tokenResponse),
    onError: onError,
  });

  return (
    <Button
      name={"Login with Google"}
      style="general"
      className="w-full py-3 border border-white/40 text-smoothWhite hover:bg-white/40"
      icon={<FcGoogle size={20} />}
      onClick={() => login()}
    />
  );
};

export default GoogleLoginButton;
