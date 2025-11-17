"use client";
import { useState } from "react";
import { Input, Button, Separator, Anchor } from "../UI";
import * as constants from "@/constants/common";
import { FcGoogle } from "react-icons/fc";
import {
  useProviderSignupMutation,
  useSignupMutation,
} from "@/lib/store/api/authApi";
import { setUser, setGoogleUser } from "@/lib/store/slices/authSlice";
import { useDispatch } from "react-redux";
import GoogleButton from "../GoogleAuth/GoogleButton";
type Prop = {
  setContainer: (container: "login" | "signup") => void;
};
const SignupContainer = ({ setContainer }: Prop) => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [googleSignup, googleSignupState] = useProviderSignupMutation();
  const [showPassword, setShowPassword] = useState(false);

  const [signupUser, signupState] = useSignupMutation();
  const dispatch = useDispatch();
  const handleOnSignUp = async () => {
    const data = await signupUser({
      email,
      password,
      confirmPassword: password,
      username,
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
    }
  };

  const handleGoogleSignupSuccess = async (userInfo: any) => {
    try {
      console.log({ userInfo });
      const response = await googleSignup({
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

  return (
    <div className="flex flex-col gap-3 sm:gap-4 w-full">
      <Input
        placeholder="Enter your username"
        label="Username"
        type="text"
        style="auth"
        isChecked={true}
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <Input
        placeholder="Enter your email address"
        label="Email"
        type="email"
        style="auth"
        isChecked={false}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
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
        onChange={(e) => setPassword(e.target.value)}
      />
      <div className="flex flex-col gap-3 sm:gap-4">
        <Button
          name={"Signup"}
          style="secondary"
          className="w-full py-2.5 sm:py-3 bg-logoColor text-sm sm:text-base"
          onClick={handleOnSignUp}
        />
        <div className="flex gap-1 items-center justify-center opacity-50 text-xs">
          <Separator />
          <span>or</span>
          <Separator />
        </div>
        <GoogleButton
          name="Signup with Google"
          onSuccess={handleGoogleSignupSuccess}
          onError={() => {
            console.log("Login Failed");
            // Handle login failure, e.g., show a notification
          }}
        />
        <div className="">
          <span className="flex items-center justify-center font-semibold text-xs sm:text-sm">
            Already have an account?
            {!!setContainer ? (
              <span
                onClick={handleOnLoginClick}
                className="m-0 p-0 pl-1 cursor-pointer text-pink-500"
              >
                LOGIN
              </span>
            ) : (
              <Anchor
                name="LOGIN"
                url={constants.pageType.login}
                className="m-0 p-0 text-pink-500"
              />
            )}
          </span>
        </div>
      </div>
    </div>
  );
};

export default SignupContainer;
