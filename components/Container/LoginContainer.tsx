"use client";
import { useState } from "react";
import { Input, Button, Separator, Anchor } from "../UI";
import GoogleLoginButton from "../GoogleAuth/GoogleLoginButton";
import * as constants from "@/constants/common";
import { FcGoogle } from "react-icons/fc";
import { useLoginMutation, useGoogleLoginMutation } from "@/lib/store/api/authApi";
import { setUser } from "@/lib/store/slices/authSlice";
import { useDispatch } from "react-redux";
import { TokenResponse } from "@react-oauth/google";

type Prop = {
  setContainer: (container: "login" | "signup") => void | null;
  isModel?: boolean; // Optional prop to indicate if it's a modal
};
const LoginContainer = ({ setContainer, isModel = false }: Prop) => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loginUser, loginState] = useLoginMutation();
  const [googleLogin, googleLoginState] = useGoogleLoginMutation();
  const dispatch = useDispatch();
  const handleTogglePassword = () => {
    setShowPassword((prevState) => !prevState);
    console.log("toggle func is clicked");
  };

  const handleLogin = async () => {
    const response = await loginUser({ email, password }).unwrap();
    console.log(response.data, loginState);
    dispatch(setUser(response));
  };

  const handleGoogleLoginSuccess = async (tokenResponse: Omit<TokenResponse, "error" | "error_description" | "error_uri">) => {
    try {
      const response = await googleLogin({
        accessToken: tokenResponse.access_token,
      }).unwrap();
      dispatch(setUser(response));
    } catch (error) {
      console.error("Google login failed", error);
    }
  };

  const handleOnEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)
  const handleOnPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)
  const handleOnSignupClick = () => {
    if (setContainer) {
      setContainer("signup");
    }
  };
  return (
    <div className="flex flex-col gap-4 w-full">
      <Input
        placeholder="Enter your email address"
        label="Email"
        type="email"
        style="auth"
        isChecked={false}
        value={email}
        onChange={handleOnEmailChange}
      />
      <Input
        placeholder="Enter your password"
        label="Password"
        type="password" // Default type is password
        isPassword={true} // Indicates this is a password field
        showPassword={showPassword} // Control visibility state
        style="auth" // Use auth styling
        onTogglePassword={handleTogglePassword} // Toggle visibility on click
        value={password}
        onChange={handleOnPasswordChange}
      />
      <div className="flex flex-col gap-4">
        <Button
          name={"Login"}
          style="secondary"
          className="w-full py-3 bg-logoColor "
          onClick={handleLogin}
        />
        <div className="flex gap-1 items-center justify-center opacity-50 text-xs">
          <Separator />
          <span>or</span>
          <Separator />
        </div>
        <GoogleLoginButton
          onSuccess={handleGoogleLoginSuccess}
          onError={() => {
            console.log("Login Failed");
            // Handle login failure, e.g., show a notification
          }}
        />
        <div className=" ">
          <span className="flex items-center justify-center font-semibold text-xs ">
            New on movmash?{" "}
            {!!setContainer ? <span onClick={handleOnSignupClick} className=" m-0 p-0 pl-1 cursor-pointer text-purple-500">SIGNUP NOW</span> : <Anchor
              name="SIGNUP NOW"
              url={constants.pageType.signup}
              className=" m-0 p-0 text-purple-500"
            /> }
          </span>
        </div>
      </div>
    </div>
  );
};

export default LoginContainer;
