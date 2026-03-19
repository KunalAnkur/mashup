"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { LuArrowLeft, LuChevronDown, LuLogIn } from "react-icons/lu";
import { RootState } from "@/lib/store";
import { useTranslations } from "@/i18n/I18nProvider";
import { LanguageSelector } from "@/components/LanguageSelector";
import LoginDropdown from "@/components/Header/LoginDropdown";
import {
  appEntryPageBrandClass,
  appEntryPageBrandTextClass,
  appEntryPageHeaderControlsClass,
  appEntryPageHeaderFixedShellClass,
  appEntryPageHeaderFlowShellClass,
  appEntryPageHeaderLeftSectionClass,
  appEntryPageHeaderNavClusterClass,
  appEntryPageHeaderRightSectionClass,
  appEntryPageHeaderRowClass,
  appEntryPageHeaderTitleOverlayClass,
  appEntryPageLoginTriggerClass,
  appPageHeaderBackButtonClass,
  appPageHeaderBackIconClass,
  appPageHeaderTitleClass,
} from "@/components/UI/classTokens";
import AvatarDropdown from "./AvatarDropdown";
import Logo from "./Logo";
import { useDropdownDismiss } from "./useDropdownDismiss";

type EntryPageHeaderProps = {
  title?: string;
  onBack?: () => void;
  fixed?: boolean;
  showLanguage?: boolean;
  showBrandOnSubpage?: boolean;
  showBackButton?: boolean;
};

const entryHeaderAvatarSize = 28;

type LoginDropdownTriggerProps = {
  dropdownRef: React.RefObject<HTMLDivElement | null>;
  isOpen: boolean;
  label: string;
  menuId: string;
  onClose: () => void;
  onToggle: () => void;
};

const LoginDropdownTrigger = ({
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
      className={appEntryPageLoginTriggerClass}
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
    {isOpen && (
      <LoginDropdown id={menuId} ariaLabel={label} onClose={onClose} />
    )}
  </div>
);

const EntryPageHeader = ({
  title,
  onBack,
  fixed = false,
  showLanguage = true,
  showBrandOnSubpage = false,
  showBackButton = Boolean(onBack),
}: EntryPageHeaderProps) => {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const [showLoginDropdown, setShowLoginDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const loginDropdownMenuId = useId();
  const t = useTranslations("home");
  const shellClass = fixed
    ? appEntryPageHeaderFixedShellClass
    : appEntryPageHeaderFlowShellClass;
  const hasCenteredTitle = Boolean(title);
  const isSubpage = hasCenteredTitle || Boolean(onBack);

  useDropdownDismiss({
    isOpen: showLoginDropdown,
    onClose: () => setShowLoginDropdown(false),
    refs: [dropdownRef],
    closeOnEscape: false,
    pointerEvent: "mousedown",
  });

  useEffect(() => {
    if (isAuthenticated) {
      setShowLoginDropdown(false);
    }
  }, [isAuthenticated]);

  const shouldShowBackButton = Boolean(onBack) && showBackButton;

  const brand = (
    <Link href="/" className={appEntryPageBrandClass}>
      <Logo height={28} width={28} custom={true} />
      <h3
        className={`${appEntryPageBrandTextClass} ${
          isSubpage ? "hidden sm:block" : ""
        }`}
      >
        {t("brand")}
      </h3>
    </Link>
  );

  const left = isSubpage ? (
    showBrandOnSubpage ? (
      brand
    ) : (
      <div className={appEntryPageHeaderNavClusterClass}>
        {shouldShowBackButton ? (
          <button
            type="button"
            onClick={onBack}
            className={appPageHeaderBackButtonClass}
            aria-label="Go back"
          >
            <LuArrowLeft
              size={19}
              strokeWidth={2.6}
              className={appPageHeaderBackIconClass}
            />
          </button>
        ) : null}
      </div>
    )
  ) : (
    brand
  );

  const right = (
    <div className={appEntryPageHeaderControlsClass}>
      {showLanguage ? <LanguageSelector /> : null}
      {isAuthenticated ? (
        <div className="flex h-full items-center">
          <AvatarDropdown size={entryHeaderAvatarSize} />
        </div>
      ) : (
        <LoginDropdownTrigger
          dropdownRef={dropdownRef}
          isOpen={showLoginDropdown}
          label={t("login")}
          menuId={loginDropdownMenuId}
          onClose={() => setShowLoginDropdown(false)}
          onToggle={() => setShowLoginDropdown((prev) => !prev)}
        />
      )}
    </div>
  );

  return (
    <div
      className={shellClass}
      style={{ direction: "ltr" }}
    >
      <div className={appEntryPageHeaderRowClass}>
        {hasCenteredTitle ? (
          <div className={appEntryPageHeaderTitleOverlayClass}>
            <h2 className={appPageHeaderTitleClass}>{title}</h2>
          </div>
        ) : null}

        <div className={`${appEntryPageHeaderLeftSectionClass} relative z-10`}>
          {left}
        </div>
        <div className={`${appEntryPageHeaderRightSectionClass} relative z-10`}>
          {right}
        </div>
      </div>
    </div>
  );
};

export default EntryPageHeader;
