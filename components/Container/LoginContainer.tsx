"use client";
import { useState } from "react";
import { Input, Button, Separator, Anchor } from "../UI";
import GoogleButton from "../GoogleAuth/GoogleButton";
import * as constants from "@/constants/common";
import {
  useLoginMutation,
  useProviderLoginMutation,
} from "@/lib/store/api/authApi";
import { setUser, setGoogleUser } from "@/lib/store/slices/authSlice";
import { useDispatch } from "react-redux";

type Prop = {
  setContainer: (container: "login" | "signup") => void | null;
  isModel?: boolean; // Optional prop to indicate if it's a modal
};
const LoginContainer = ({ setContainer }: Prop) => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loginUser, loginState] = useLoginMutation();
  const [googleLogin] = useProviderLoginMutation();
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

  const handleGoogleLoginSuccess = async (userInfo: any) => {
    try {
      console.log({ userInfo });
      const response = await googleLogin({
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture,
        sub: userInfo.sub,
        provider_name: "google",
      }).unwrap();

      // First set the user with backend response
      dispatch(setUser(response));

      // Then update with Google OAuth specific data (profile picture, name)
      dispatch(
        setGoogleUser({
          profilePicture: userInfo.picture,
          name: userInfo.name,
          email: userInfo.email,
        })
      );
    } catch (error) {
      console.error("Google login failed", error);
    }
  };

  const handleOnEmailChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setEmail(e.target.value);
  const handleOnPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setPassword(e.target.value);
  const handleOnSignupClick = () => {
    if (setContainer) {
      setContainer("signup");
    }
  };
  return (
    <div className="flex flex-col gap-3 sm:gap-4 w-full ">
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
      <div className="flex flex-col gap-3 sm:gap-4">
        <Button
          name={"Login"}
          style="secondary"
          className="w-full py-2.5 sm:py-3 bg-logoColor text-sm sm:text-base"
          onClick={handleLogin}
        />
        <div className="flex gap-1 items-center justify-center opacity-50 text-xs">
          <Separator />
          <span>or</span>
          <Separator />
        </div>
        <GoogleButton
          name="Login with Google"
          onSuccess={handleGoogleLoginSuccess}
          onError={() => {
            console.log("Login Failed");
            // Handle login failure, e.g., show a notification
          }}
        />
        <div className="">
          <span className="flex items-center justify-center font-semibold text-xs sm:text-sm">
            New on movmash?{" "}
            {!!setContainer ? (
              <span
                onClick={handleOnSignupClick}
                className="m-0 p-0 pl-1 cursor-pointer text-pink-500"
              >
                SIGNUP NOW
              </span>
            ) : (
              <Anchor
                name="SIGNUP NOW"
                url={constants.pageType.signup}
                className="m-0 p-0 text-pink-500"
              />
            )}
          </span>
        </div>
      </div>
    </div>
  );
};

export default LoginContainer;
