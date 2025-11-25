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
      className="w-full py-3 rounded-xl bg-white/5 text-gray-300 text-sm px-4 hover:bg-white/10 hover:text-white transition-all duration-200 font-medium border border-white/10"
      icon={<FcGoogle size={20} />}
      onClick={() => login()}
    />
  );
};

export default GoogleButton;
