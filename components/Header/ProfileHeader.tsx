"use client";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import AvatarDropdown from "@/components/UI/AvatarDropdown";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { useTranslations } from "@/i18n/I18nProvider";
import LoginDropdown from "./LoginDropdown";
import { LanguageSelector } from "@/components/LanguageSelector";
import Image from "next/image";
import { Logo } from "@/components/UI";
type ProfileHeaderProps = {
  onLoginClick?: () => void;
};

const ProfileHeader = ({ onLoginClick }: ProfileHeaderProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const [showLoginDropdown, setShowLoginDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const t = useTranslations("home");

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
  // Note: Using explicit right positioning to keep components on right even for RTL languages
  if (isFixedPage) {
    return (
      <div className="absolute top-4 left-4 right-4 sm:left-auto sm:right-4 z-50 flex items-center justify-between sm:justify-end" style={{ direction: 'ltr' }}>
        {/* Brand name - visible on mobile only */}
        <div className="flex items-center gap-2 sm:hidden">
          {/* <Image
            src={Logo}
            alt="Movmash Logo"
            priority
            width={28}
            height={28}
            className="w-7 h-7"
          /> */}
          <Logo height={28} width={28} custom={true} />
          <h3 className="text-xl font-extrabold text-white font-parkinsans tracking-tight">
            {t("brand")}
          </h3>
        </div>
        
        {/* Right side: Language selector and auth controls */}
        <div className="flex items-center flex-row gap-2 sm:gap-3">
          <LanguageSelector />
          {isAuthenticated ? (
            <AvatarDropdown size={40} />
          ) : (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={handleLoginClick}
                className="text-white text-sm font-medium hover:text-pink-400 transition-colors duration-200"
              >
                {t("login")}
              </button>
              {showLoginDropdown && (
                <LoginDropdown onClose={() => setShowLoginDropdown(false)} />
              )}
            </div>
          )}
        </div>
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
            {t("login")}
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

