"use client";
import { useGoogleLogin, TokenResponse } from "@react-oauth/google";
import { Button } from "../UI";
import { FcGoogle } from "react-icons/fc";
import axios from "axios";

type Props = {
  name: string;
  onSuccess: (
    tokenResponse: Omit<TokenResponse, "error" | "error_description" | "error_uri">
  ) => void;
  onError?: () => void;
};

const GoogleButton = ({ onSuccess, onError, name }: Props) => {
  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) =>{ 
      console.log(tokenResponse.access_token)
      const userInfo = await axios
        .get('https://www.googleapis.com/oauth2/v3/userinfo',
          {
            headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
          })
      const result = userInfo.data;
      onSuccess(result)
    },
    onError: onError,
  });

  return (
    <Button
      name={name}
      style="general"
      className="w-full py-3 border border-white/40 text-smoothWhite hover:bg-white/40"
      icon={<FcGoogle size={20} />}
      onClick={() => login()}
    />
  );
};

export default GoogleButton;
