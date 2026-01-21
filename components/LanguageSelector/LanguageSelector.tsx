"use client";

import { useState, useRef, useEffect } from "react";
import { locales, languageNames, isRtlLocale, type Locale } from "@/i18n/config";
import { FaGlobe, FaChevronDown, FaCheck } from "react-icons/fa";
import { useLocale } from "@/i18n/I18nProvider";

const LanguageSelector = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isChanging, setIsChanging] = useState(false);
  const currentLocale = useLocale();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debug: Log on mount
  useEffect(() => {
    console.log('[LanguageSelector] Component mounted, currentLocale:', currentLocale);
    console.log('[LanguageSelector] Current cookies on mount:', document.cookie);
  }, [currentLocale]);

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
    console.log('[LanguageSelector] Toggle dropdown clicked, isOpen:', !isOpen);
    setIsOpen(!isOpen);
  };

  const handleLanguageChange = (newLocale: Locale) => {
    console.log('[LanguageSelector] ========== LANGUAGE CHANGE ==========');
    console.log('[LanguageSelector] From:', currentLocale, 'To:', newLocale);
    
    if (newLocale === currentLocale) {
      console.log('[LanguageSelector] Same language, closing dropdown');
      setIsOpen(false);
      return;
    }

    // Show loading state
    setIsChanging(true);
    setIsOpen(false);

    // Set locale cookie with 1 year expiration
    const cookieValue = `NEXT_LOCALE=${newLocale};path=/;max-age=31536000;SameSite=Lax`;
    console.log('[LanguageSelector] Setting cookie:', cookieValue);
    document.cookie = cookieValue;
    
    // Verify cookie was set
    const allCookies = document.cookie;
    console.log('[LanguageSelector] All cookies after setting:', allCookies);
    const hasNewCookie = allCookies.includes(`NEXT_LOCALE=${newLocale}`);
    console.log('[LanguageSelector] Cookie was set successfully:', hasNewCookie);
    
    // Force a hard reload
    console.log('[LanguageSelector] Will reload in 100ms...');
    setTimeout(() => {
      console.log('[LanguageSelector] Reloading NOW to:', window.location.pathname);
      window.location.href = window.location.pathname + window.location.search;
    }, 100);
  };

  const currentLanguage = languageNames[currentLocale];
  console.log('[LanguageSelector] Rendering with locale:', currentLocale, 'language:', currentLanguage?.nativeName);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleToggleDropdown}
        disabled={isChanging}
        className={`flex items-center gap-1 sm:gap-2 px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg sm:rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 
          text-white/80 hover:text-white hover:bg-white/10 hover:border-white/20 
          transition-all duration-200 text-sm font-medium
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
        <div 
          className="absolute top-full mt-2 right-0 w-48 bg-[#1f1f23]/95 backdrop-blur-xl 
            border border-white/10 rounded-xl shadow-xl shadow-black/20 
            overflow-hidden z-50 animate-[fadeIn_0.2s_ease-out_forwards]"
        >
          <div className="py-1">
            {locales.map((loc) => {
              const language = languageNames[loc];
              const isSelected = loc === currentLocale;
              
              return (
                <button
                  key={loc}
                  onClick={() => handleLanguageChange(loc)}
                  disabled={isChanging}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm 
                    transition-colors duration-150 text-left
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
