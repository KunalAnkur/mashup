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
    
    // Small delay to ensure everything is loaded
    const timer = setTimeout(() => {
      // Always detect browser language for logging (even if cookie exists)
      const { locale: browserLocale, rawLang, langCode } = getBrowserLocale();
      
      // Check if cookie exists
      const existingCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('NEXT_LOCALE='));

      if (!existingCookie) {
              // Always set cookie to browser locale on first visit (even if it matches default)
        document.cookie = `NEXT_LOCALE=${browserLocale};path=/;max-age=31536000;SameSite=Lax`;
        console.log('[i18n] 🔄 Reloading page to apply browser language...');
        window.location.reload();
      } else {
        // USER HAS SELECTED LANGUAGE: Cookie exists - use it (manual selection takes precedence)
        const cookieLocale = existingCookie.split('=')[1].trim() as Locale;
        console.log('[i18n] ✅ Cookie exists - User has selected a language');
        console.log('[i18n] 🍪 Cookie locale (user selection):', cookieLocale);
        console.log('[i18n] 🌐 Browser would prefer:', browserLocale);
        console.log('[i18n] ✨ User selection takes precedence - keeping:', cookieLocale);
        console.log('[i18n] 💡 To reset: Clear cookie or use incognito mode');
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [locale]);

  return null; // This component doesn't render anything
}
