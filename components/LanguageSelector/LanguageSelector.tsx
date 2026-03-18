"use client";

import {
  appFrostedBackdropClass,
  appWhiteEmphasisSurfaceClass,
  appWhiteBorderClass,
} from "@/components/UI/classTokens";
import { useId, useRef, useState } from "react";
import { locales, languageNames, isRtlLocale, type Locale } from "@/i18n/config";
import { FaGlobe, FaChevronDown, FaCheck } from "react-icons/fa";
import { useLocale } from "@/i18n/I18nProvider";
import {
  DropdownActionRow,
  DropdownPanel,
} from "@/components/UI/DropdownPrimitives";
import { useDropdownDismiss } from "@/components/UI/useDropdownDismiss";

const languageSelectorTriggerClass =
  `flex items-center gap-1 rounded-lg ${appWhiteBorderClass} bg-white/5 px-2 py-1.5 text-sm font-medium text-white/80 ${appFrostedBackdropClass} transition-all duration-200 hover:border-white/20 hover:bg-white/10 hover:text-white sm:gap-2 sm:rounded-xl sm:px-3 sm:py-2`;
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
        onClick={handleToggleDropdown}
        disabled={isChanging}
        className={`${languageSelectorTriggerClass}
          ${isChanging ? "opacity-50 cursor-wait" : ""}`}
        aria-label="Select language"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-controls={dropdownMenuId}
      >
        <FaGlobe className="text-xs sm:text-sm text-pink-400" />
        <span className="hidden sm:inline">{currentLanguage.nativeName}</span>
        <span className="sm:hidden text-base">{currentLanguage.flag}</span>
        <FaChevronDown 
          className={`text-[10px] sm:text-xs transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} 
        />
      </button>

      {isOpen && (
        <DropdownPanel
          id={dropdownMenuId}
          role="menu"
          aria-label="Language selector"
          className={languageSelectorMenuClass}
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
                className={`${isSelected ? appWhiteEmphasisSurfaceClass : ""} ${
                  isRtl ? "flex-row-reverse text-right" : ""
                } ${isChanging ? "opacity-50" : ""} ${!isSelected ? "text-white/70" : ""}`}
              />
            );
          })}
        </DropdownPanel>
      )}
    </div>
  );
};

export default LanguageSelector;
