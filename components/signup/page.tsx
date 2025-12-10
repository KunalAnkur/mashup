"use client";
import { SignupContainer } from "@/components";
import { useRouter } from "next/navigation";

const Signup = () => {
  const router = useRouter();
  
  return <SignupContainer setContainer={null} />;
};

export default Signup;
