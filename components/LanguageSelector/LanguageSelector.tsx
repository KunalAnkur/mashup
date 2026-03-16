"use client";

import { useState, useRef, useEffect } from "react";
import { locales, languageNames, isRtlLocale, type Locale } from "@/i18n/config";
import { FaGlobe, FaChevronDown, FaCheck } from "react-icons/fa";
import { useLocale } from "@/i18n/I18nProvider";

const languageSelectorTriggerClass =
  "flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-sm font-medium text-white/80 backdrop-blur-xl transition-all duration-200 hover:border-white/20 hover:bg-white/10 hover:text-white sm:gap-2 sm:rounded-xl sm:px-3 sm:py-2";
const languageSelectorMenuClass =
  "absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-xl border border-white/10 bg-[#1f1f23]/95 shadow-xl shadow-black/20 backdrop-blur-xl animate-[fadeIn_0.2s_ease-out_forwards]";
const languageSelectorOptionBaseClass =
  "w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors duration-150";

const LanguageSelector = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isChanging, setIsChanging] = useState(false);
  const currentLocale = useLocale();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

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
      >
        <FaGlobe className="text-xs sm:text-sm text-pink-400" />
        <span className="hidden sm:inline">{currentLanguage.nativeName}</span>
        <span className="sm:hidden text-base">{currentLanguage.flag}</span>
        <FaChevronDown 
          className={`text-[10px] sm:text-xs transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} 
        />
      </button>

      {isOpen && (
        <div className={languageSelectorMenuClass}>
          <div className="py-1">
            {locales.map((loc) => {
              const language = languageNames[loc];
              const isSelected = loc === currentLocale;
              
              return (
                <button
                  key={loc}
                  onClick={() => handleLanguageChange(loc)}
                  disabled={isChanging}
                  className={`${languageSelectorOptionBaseClass}
                    ${isSelected 
                      ? "bg-pink-500/20 text-pink-400" 
                      : "text-white/70 hover:bg-white/5 hover:text-white"
                    }
                    ${isRtlLocale(loc) ? "flex-row-reverse text-right" : ""}
                    ${isChanging ? "opacity-50" : ""}`}
                >
                  <span className="text-lg">{language.flag}</span>
                  <span className="flex-1">{language.nativeName}</span>
                  {isSelected && <FaCheck className="text-xs text-pink-400" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;
