"use client";
import { useState } from "react";
import { Input } from "../UI";

const LoginContainer = () => {
  const [showPassword, setShowPassword] = useState(false);

  const handleTogglePassword = () => {
    setShowPassword((prevState) => !prevState);
    console.log("toggle func is clicked");
  };

  return (
    <div className="flex flex-col gap-4">
      <Input
        placeholder="Enter your username"
        label="Username"
        type="text" // Default type is password
        isPassword={false} // Indicates this is a password field
        style="auth" // Use auth styling
        isChecked={true}
      />
      <Input
        placeholder="Enter your email address"
        label="Email"
        type="email" // Default type is password
        isPassword={false} // Indicates this is a password field
        style="auth" // Use auth styling
        isChecked={false}
      />
      <Input
        placeholder="Enter your password"
        label="Password"
        type="password" // Default type is password
        isPassword={true} // Indicates this is a password field
        showPassword={showPassword} // Control visibility state
        style="auth" // Use auth styling
        onTogglePassword={handleTogglePassword} // Toggle visibility on click
      />
    </div>
  );
};

export default LoginContainer;
