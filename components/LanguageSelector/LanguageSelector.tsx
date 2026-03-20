"use client";

import {
  appFrostedBackdropClass,
  appWhiteEmphasisSurfaceClass,
} from "@/components/UI/classTokens";
import { useId, useRef, useState } from "react";
import { locales, languageNames, isRtlLocale, type Locale } from "@/i18n/config";
import { FaChevronDown, FaCheck } from "react-icons/fa";
import { useLocale } from "@/i18n/I18nProvider";
import {
  DropdownActionRow,
  DropdownPanel,
} from "@/components/UI/DropdownPrimitives";
import { useDropdownDismiss } from "@/components/UI/useDropdownDismiss";

const languageSelectorTriggerClass =
  `flex h-10 items-center gap-1.5 rounded-full bg-white/[0.035] px-3 text-sm font-medium leading-none text-white/74 ${appFrostedBackdropClass} transition-all duration-200 hover:bg-white/[0.06] hover:text-white`;
const languageSelectorMenuClass =
  `animate-[fadeIn_0.2s_ease-out_forwards]`;

const LanguageSelector = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isChanging, setIsChanging] = useState(false);
  const currentLocale = useLocale();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dropdownMenuId = useId();

  useDropdownDismiss({
    isOpen,
    onClose: () => setIsOpen(false),
    refs: [dropdownRef],
    closeOnEscape: false,
    pointerEvent: "mousedown",
  });

  const handleToggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleLanguageChange = (newLocale: Locale) => {
    if (newLocale === currentLocale) {
      setIsOpen(false);
      return;
    }

    // Show loading state
    setIsChanging(true);
    setIsOpen(false);

    // Set locale cookie with 1 year expiration
    document.cookie = `NEXT_LOCALE=${newLocale};path=/;max-age=31536000;SameSite=Lax`;

    // Force a hard reload
    setTimeout(() => {
      window.location.href = window.location.pathname + window.location.search;
    }, 100);
  };

  const currentLanguage = languageNames[currentLocale];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={handleToggleDropdown}
        disabled={isChanging}
        className={`${languageSelectorTriggerClass}
          ${isChanging ? "opacity-50 cursor-wait" : ""}`}
        aria-label="Select language"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-controls={dropdownMenuId}
      >
        <span className="text-base leading-none">{currentLanguage.flag}</span>
        <span className="hidden sm:inline">{currentLanguage.nativeName}</span>
        <FaChevronDown 
          className={`text-[10px] transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} 
        />
      </button>

      {isOpen && (
        <DropdownPanel
          id={dropdownMenuId}
          role="menu"
          aria-label="Language selector"
          className={`w-40 md:w-44 ${languageSelectorMenuClass}`}
        >
          {locales.map((loc) => {
            const language = languageNames[loc];
            const isSelected = loc === currentLocale;
            const isRtl = isRtlLocale(loc);

            return (
              <DropdownActionRow
                key={loc}
                role="menuitem"
                onClick={() => handleLanguageChange(loc)}
                disabled={isChanging}
                iconChipClassName={appWhiteEmphasisSurfaceClass}
                icon={<span className="text-base">{language.flag}</span>}
                label={
                  <span
                    className={`flex w-full items-center justify-between gap-2 ${
                      isRtl ? "flex-row-reverse" : ""
                    }`}
                  >
                    <span className="min-w-0 flex-1 truncate">
                      {language.nativeName}
                    </span>
                    {isSelected && (
                      <FaCheck className="text-[10px] text-white/80" />
                    )}
                  </span>
                }
                labelClassName="min-w-0 flex-1"
                className={`${isSelected ? "bg-white/[0.06] text-white" : ""} ${
                  isRtl ? "flex-row-reverse text-right" : ""
                } ${isChanging ? "opacity-50" : ""} ${!isSelected ? "text-white/70 hover:bg-white/[0.04] hover:text-white" : ""}`}
              />
            );
          })}
        </DropdownPanel>
      )}
    </div>
  );
};

export default LanguageSelector;
