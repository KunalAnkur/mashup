"use client";
import { LoginContainer } from "@/components";
import { useRouter } from "next/navigation";

const Login = () => {
  const router = useRouter();
  
  return <LoginContainer setContainer={null} />;
};

export default Login;
