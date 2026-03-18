"use client";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import AvatarDropdown from "@/components/UI/AvatarDropdown";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect, useId } from "react";
import { useTranslations } from "@/i18n/I18nProvider";
import LoginDropdown from "./LoginDropdown";
import { LanguageSelector } from "@/components/LanguageSelector";
import { Logo } from "@/components/UI";
import { useDropdownDismiss } from "@/components/UI/useDropdownDismiss";

const fixedHeaderContainerClass =
  "absolute top-4 left-4 right-4 z-50 flex items-center justify-between sm:left-auto sm:right-4 sm:justify-end";
const headerControlsClass = "flex flex-row items-center gap-2 sm:gap-3";
const fixedLoginTriggerClass =
  "text-sm font-medium text-white transition-colors duration-200 hover:text-pink-400";
const compactLoginTriggerClass =
  "px-2 py-1 text-xs font-medium text-white transition-colors duration-200 hover:text-pink-400 sm:text-sm";

type LoginDropdownTriggerProps = {
  buttonClassName: string;
  dropdownRef: React.RefObject<HTMLDivElement | null>;
  isOpen: boolean;
  label: string;
  menuId: string;
  onClose: () => void;
  onToggle: () => void;
};

const LoginDropdownTrigger = ({
  buttonClassName,
  dropdownRef,
  isOpen,
  label,
  menuId,
  onClose,
  onToggle,
}: LoginDropdownTriggerProps) => (
  <div className="relative" ref={dropdownRef}>
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={isOpen}
      aria-haspopup="menu"
      aria-controls={menuId}
      className={buttonClassName}
    >
      {label}
    </button>
    {isOpen && <LoginDropdown id={menuId} ariaLabel={label} onClose={onClose} />}
  </div>
);

const ProfileHeader = () => {
  const pathname = usePathname();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const [showLoginDropdown, setShowLoginDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const loginDropdownMenuId = useId();
  const t = useTranslations("home");

  // Check if we're on a page that should have fixed positioning
  const isFixedPage = pathname === "/" || pathname === "/not-found";

  useDropdownDismiss({
    isOpen: showLoginDropdown,
    onClose: () => setShowLoginDropdown(false),
    refs: [dropdownRef],
    closeOnEscape: false,
    pointerEvent: "mousedown",
  });

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
      <div className={fixedHeaderContainerClass} style={{ direction: "ltr" }}>
        {/* Brand name - visible on mobile only */}
        <div className="flex items-center gap-2 sm:hidden">
          <Logo height={28} width={28} custom={true} />
          <h3 className="text-xl font-extrabold text-white font-parkinsans tracking-tight">
            {t("brand")}
          </h3>
        </div>
        
        {/* Right side: Language selector and auth controls */}
        <div className={headerControlsClass}>
          <LanguageSelector />
          {isAuthenticated ? (
            <AvatarDropdown size={40} />
          ) : (
            <LoginDropdownTrigger
              buttonClassName={fixedLoginTriggerClass}
              dropdownRef={dropdownRef}
              isOpen={showLoginDropdown}
              label={t("login")}
              menuId={loginDropdownMenuId}
              onClose={() => setShowLoginDropdown(false)}
              onToggle={handleLoginClick}
            />
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
        <LoginDropdownTrigger
          buttonClassName={compactLoginTriggerClass}
          dropdownRef={dropdownRef}
          isOpen={showLoginDropdown}
          label={t("login")}
          menuId={loginDropdownMenuId}
          onClose={() => setShowLoginDropdown(false)}
          onToggle={handleLoginClick}
        />
      )}
    </>
  );
};

export default ProfileHeader;
