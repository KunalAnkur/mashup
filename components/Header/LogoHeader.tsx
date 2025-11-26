"use client";
import { Logo } from "@/components";

const LogoHeader = () => {
  return (
    <div className="fixed top-4 left-4 md:top-6 md:left-6 lg:top-8 lg:left-8 z-50">
      <Logo size="md" href="/" showText={true} />
    </div>
  );
};

export default LogoHeader;

