"use client";

import { useEffect, useRef } from "react";
import { useLocale } from "@/i18n/I18nProvider";
import { locales, defaultLocale, type Locale } from "@/i18n/config";

/**
 * Parse browser language and find the best matching locale
 */
function getBrowserLocale(): { locale: Locale; rawLang: string; langCode: string } {
  if (typeof window === 'undefined') {
    return { locale: defaultLocale, rawLang: 'server', langCode: 'server' };
  }
  
  const browserLang = navigator.language || (navigator as any).userLanguage || '';
  const languages = navigator.languages || [browserLang];
  const langCode = browserLang.toLowerCase().split('-')[0];
  
  // Check if browser language matches any supported locale
  if (locales.includes(langCode as Locale)) {
    return { locale: langCode as Locale, rawLang: browserLang, langCode };
  }
  
  // Try to find a match from navigator.languages array
  for (const lang of languages) {
    const code = lang.toLowerCase().split('-')[0];
    if (locales.includes(code as Locale)) {
      console.log('[i18n] Found match in navigator.languages:', code);
      return { locale: code as Locale, rawLang: lang, langCode: code };
    }
  }
  
  return { locale: defaultLocale, rawLang: browserLang, langCode };
}

/**
 * Client-side component to detect and persist browser language
 */
export default function LocalePersistence() {
  const hasRunRef = useRef(false);
  
  // Must call hook unconditionally
  const locale = useLocale();

  useEffect(() => {
    // Only run once on mount
    if (hasRunRef.current) return;
    hasRunRef.current = true;
    
    // Check if cookie exists BEFORE any delay
    const existingCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('NEXT_LOCALE='));

    // If cookie exists, user has already selected a language - don't reload
    if (existingCookie) {
      const cookieLocale = existingCookie.split('=')[1].trim() as Locale;
      console.log('[i18n] ✅ Cookie exists - User has selected a language:', cookieLocale);
      return; // Early return - no reload needed
    }

    // Cookie doesn't exist - set it to browser locale
    // Use a longer delay to ensure page is fully loaded and no modals are open
    const timer = setTimeout(() => {
      const { locale: browserLocale } = getBrowserLocale();
      document.cookie = `NEXT_LOCALE=${browserLocale};path=/;max-age=31536000;SameSite=Lax`;
      console.log('[i18n] 🔄 Setting browser locale cookie and reloading...');
      // Only reload if we're not in the middle of user interaction
      // Check if any modal is open by checking for common modal classes or z-index overlay
      const hasOpenModal = document.querySelector('.logout-modal, .feedback-modal, .leave-modal, [role="dialog"]');
      console.log('[i18n] Modal check result:', hasOpenModal);
      if (!hasOpenModal) {
        console.log('[i18n] No modal detected, reloading...');
        window.location.reload();
      } else {
        console.log('[i18n] ⏸️ Modal is open, skipping reload to preserve user state');
      }
    }, 1000); // Longer delay to avoid interfering with modals

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty array - only run once (hasRunRef ensures this)

  return null; // This component doesn't render anything
}
