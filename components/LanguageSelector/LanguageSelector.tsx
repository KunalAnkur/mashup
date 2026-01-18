"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { locales, languageNames, isRtlLocale, type Locale, defaultLocale } from "@/i18n/config";
import { FaGlobe, FaChevronDown, FaCheck } from "react-icons/fa";

const LanguageSelector = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [currentLocale, setCurrentLocale] = useState<Locale>(defaultLocale);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Read locale from cookie on mount
  useEffect(() => {
    const cookies = document.cookie.split(';');
    const localeCookie = cookies.find(c => c.trim().startsWith('NEXT_LOCALE='));
    if (localeCookie) {
      const value = localeCookie.split('=')[1] as Locale;
      if (locales.includes(value)) {
        setCurrentLocale(value);
      }
    }
  }, []);

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

  const handleLanguageChange = (locale: Locale) => {
    startTransition(() => {
      // Set locale cookie and reload page
      document.cookie = `NEXT_LOCALE=${locale};path=/;max-age=31536000`;
      window.location.reload();
    });
    setIsOpen(false);
  };

  const currentLanguage = languageNames[currentLocale];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isPending}
        className={`flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 
          text-white/80 hover:text-white hover:bg-white/10 hover:border-white/20 
          transition-all duration-200 text-sm font-medium
          ${isPending ? "opacity-50 cursor-wait" : ""}`}
        aria-label="Select language"
      >
        <FaGlobe className="text-sm text-pink-400" />
        <span className="hidden sm:inline">{currentLanguage.nativeName}</span>
        <span className="sm:hidden">{currentLanguage.flag}</span>
        <FaChevronDown 
          className={`text-xs transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} 
        />
      </button>

      {isOpen && (
        <div 
          className="absolute top-full mt-2 right-0 w-48 bg-[#1f1f23]/95 backdrop-blur-xl 
            border border-white/10 rounded-xl shadow-xl shadow-black/20 
            overflow-hidden z-50 animate-[fadeIn_0.2s_ease-out_forwards]"
        >
          <div className="py-1">
            {locales.map((locale) => {
              const language = languageNames[locale];
              const isSelected = locale === currentLocale;
              
              return (
                <button
                  key={locale}
                  onClick={() => handleLanguageChange(locale)}
                  disabled={isPending}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm 
                    transition-colors duration-150 text-left
                    ${isSelected 
                      ? "bg-pink-500/20 text-pink-400" 
                      : "text-white/70 hover:bg-white/5 hover:text-white"
                    }
                    ${isRtlLocale(locale) ? "flex-row-reverse text-right" : ""}
                    ${isPending ? "opacity-50" : ""}`}
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
