"use client";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import AvatarDropdown from "@/components/UI/AvatarDropdown";
import { usePathname, useRouter } from "next/navigation";

const ProfileHeader = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  // Check if we're on a page that should have fixed positioning
  const isFixedPage = pathname === "/" || pathname === "/not-found";
  
  // For stream/sync pages, it will be integrated into the header bar
  // For other pages, it should be fixed
  if (isFixedPage) {
    return (
      <div className="fixed top-4 right-4 md:top-6 md:right-4 lg:top-8 lg:right-4 z-50 flex items-center justify-end">
        {isAuthenticated ? (
          <AvatarDropdown size={40} />
        ) : (
          <button
            onClick={() => router.push("/login")}
            className="text-white text-sm font-medium hover:text-pink-400 transition-colors duration-200"
          >
            Login
          </button>
        )}
      </div>
    );
  }

  // For stream/sync pages, return without fixed positioning (will be in header bar)
  return (
    <>
      {isAuthenticated ? (
        <AvatarDropdown size={40} />
      ) : (
        <button
          onClick={() => router.push("/login")}
          className="text-white text-sm font-medium hover:text-pink-400 transition-colors duration-200"
        >
          Login
        </button>
      )}
    </>
  );
};

export default ProfileHeader;

