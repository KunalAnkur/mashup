"use client";
import { useState } from "react";
import { Input, Button, Separator, Anchor } from "../UI";
import * as constants from "@/constants/common";
import { FcGoogle } from "react-icons/fc";
import { useSignupMutation } from "@/lib/store/api/authApi";
import { setUser } from "@/lib/store/slices/authSlice";
import { useDispatch } from "react-redux";
type Prop = {
  setContainer: (container: "login" | "signup") => void;
}
const SignupContainer = ({ setContainer }: Prop) => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [username, setUsername] = useState<string>("");

  const [showPassword, setShowPassword] = useState(false);

  const [signupUser, signupState] = useSignupMutation();
  const dispatch = useDispatch();
  const handleOnSignUp = async () => {
    const data = await signupUser({ email, password, confirmPassword: password, username }).unwrap();
    dispatch(setUser(data));
    console.log(data, signupState);

  }

  const handleTogglePassword = () => {
    setShowPassword((prevState) => !prevState);
    console.log("toggle func is clicked");
  };

  const handleOnLoginClick = () => {
    if (setContainer) {
      setContainer("login");
    }
  }
  return (
    <div className="flex flex-col gap-4 w-full">
      <Input
        placeholder="Enter your username"
        label="Username"
        type="text" // Default type is password
        style="auth" // Use auth styling
        isChecked={true}
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <Input
        placeholder="Enter your email address"
        label="Email"
        type="email" // Default type is password
        style="auth" // Use auth styling
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
      <div className="flex flex-col gap-4">
        <Button
          name={"Signup"}
          style="secondary"
          className="w-full py-3 bg-logoColor "
          onClick={handleOnSignUp}
        />
        <div className="flex gap-1 items-center justify-center opacity-50 text-xs">
          <Separator />
          <span>or</span>
          <Separator />
        </div>
        <Button
          name={"Signup with Google"}
          style="general"
          className="w-full py-3 border border-white/40 text-smoothWhite hover:bg-hover hover:border-transparent"
          icon={<FcGoogle size={20} />}
        />
        <div className=" ">
          <span className="flex items-center justify-center font-semibold text-xs ">
            Already have an account?
            {!!setContainer ? <span onClick={handleOnLoginClick} className=" m-0 p-0 pl-1 cursor-pointer text-purple-500">LOGIN</span> :  <Anchor
              name="LOGIN"
              url={constants.pageType.login}
              className=" m-0 p-0 text-purple-500"
            />
            }
          </span>
        </div>
      </div>
    </div>
  );
};

export default SignupContainer;
