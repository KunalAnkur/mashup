"use client";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import AvatarDropdown from "@/components/UI/AvatarDropdown";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import LoginDropdown from "./LoginDropdown";

type ProfileHeaderProps = {
  onLoginClick?: () => void;
};

const ProfileHeader = ({ onLoginClick }: ProfileHeaderProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const [showLoginDropdown, setShowLoginDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Check if we're on a page that should have fixed positioning
  const isFixedPage = pathname === "/" || pathname === "/not-found";

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowLoginDropdown(false);
      }
    };

    if (showLoginDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showLoginDropdown]);

  // Close dropdown when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      setShowLoginDropdown(false);
    }
  }, [isAuthenticated]);

  const handleLoginClick = () => {
    // Always show dropdown instead of navigating to login page
    setShowLoginDropdown(!showLoginDropdown);
  };

  
  // For stream/sync pages, it will be integrated into the header bar
  // For other pages, it should be fixed
  if (isFixedPage) {
    return (
      <div className="absolute top-4 right-4 z-50 flex items-center justify-end">
        {isAuthenticated ? (
          <AvatarDropdown size={40} />
        ) : (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={handleLoginClick}
              className="text-white text-sm font-medium hover:text-pink-400 transition-colors duration-200"
            >
              Login
            </button>
            {showLoginDropdown && (
              <LoginDropdown onClose={() => setShowLoginDropdown(false)} />
            )}
          </div>
        )}
      </div>
    );
  }

  // For stream/sync pages, return without fixed positioning (will be in header bar)
  return (
    <>
      {isAuthenticated ? (
        <AvatarDropdown size={32} className="sm:scale-110" />
      ) : (
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={handleLoginClick}
            className="text-white text-xs sm:text-sm font-medium hover:text-pink-400 transition-colors duration-200 px-2 py-1"
          >
            Login
          </button>
          {showLoginDropdown && (
            <LoginDropdown onClose={() => setShowLoginDropdown(false)} />
          )}
        </div>
      )}
    </>
  );
};

export default ProfileHeader;

