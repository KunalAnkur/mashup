"use client";
import { Button, ProfileHeader, LogoHeader } from "@/components";
import Image from "next/image";
import { useRouter } from "next/navigation";

const NotFound = () => {
  const router = useRouter();

  return (
    <div className="flex h-screen bg-[#030712] items-center justify-center relative">
      <LogoHeader />
      <ProfileHeader />
      <div className="flex flex-col items-center gap-6 px-4">
        <div className="flex items-center justify-center gap-3">
          <Image
            src="/assets/logo.svg"
            alt="Movmash Logo"
            width={48}
            height={48}
            className="w-12 h-12"
          />
          <h3 className="text-3xl font-extrabold text-white text-center font-parkinsans tracking-tight">
            Movmash
          </h3>
        </div>
        
        <div className="text-center">
          <h1 className="text-6xl font-bold text-white mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-gray-300 mb-2">
            Page Not Found
          </h2>
          <p className="text-gray-400 mb-8">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <Button
          onClick={() => router.push("/")}
          className="bg-gradient-to-r from-rose-600 via-pink-600 to-fuchsia-600 hover:from-rose-500 hover:via-pink-500 hover:to-fuchsia-500 text-white font-bold px-6 py-3 rounded-xl transition-all duration-200 shadow-lg"
          name="Go Home"
        />
      </div>
    </div>
  );
};

export default NotFound;

