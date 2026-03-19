"use client";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import AvatarDropdown from "@/components/UI/AvatarDropdown";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect, useId } from "react";
import { LuChevronDown, LuLogIn } from "react-icons/lu";
import { useTranslations } from "@/i18n/I18nProvider";
import LoginDropdown from "./LoginDropdown";
import { LanguageSelector } from "@/components/LanguageSelector";
import { Logo } from "@/components/UI";
import { useDropdownDismiss } from "@/components/UI/useDropdownDismiss";

const fixedHeaderContainerClass =
  "absolute left-4 right-4 top-4 z-50 flex items-center justify-between sm:left-5 sm:right-5";
const headerControlsClass = "flex flex-row items-center gap-2.5 sm:gap-3";
const fixedBrandClass = "flex items-center gap-2.5 text-white/90";
const fixedLoginTriggerClass =
  "inline-flex h-10 items-center gap-2 px-1 text-sm font-medium text-white/76 transition-colors duration-200 hover:text-white";
const compactLoginTriggerClass =
  "inline-flex h-9 items-center gap-1.5 px-1 text-xs font-medium text-white/76 transition-colors duration-200 hover:text-white sm:text-sm";

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
      <span className="flex h-5 w-5 items-center justify-center text-white/80">
        <LuLogIn size={13} />
      </span>
      <span>{label}</span>
      <LuChevronDown
        size={14}
        className={`transition-transform duration-200 ${isOpen ? "rotate-180 text-white" : "text-white/55"}`}
      />
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
        <div className={fixedBrandClass}>
          <Logo height={28} width={28} custom={true} />
          <h3 className="font-parkinsans text-xl font-semibold tracking-tight text-white/90">
            {t("brand")}
          </h3>
        </div>

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
