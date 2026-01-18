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
  
  console.log('[i18n] Browser detection:', {
    'navigator.language': navigator.language,
    'navigator.languages': languages,
    'extracted langCode': langCode,
    'supported locales': locales,
    'is supported': locales.includes(langCode as Locale),
  });
  
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
  const locale = useLocale();
  const hasRunRef = useRef(false);

  useEffect(() => {
    // Only run once on mount
    if (hasRunRef.current) return;
    hasRunRef.current = true;
    
    console.log('[i18n] LocalePersistence mounted');
    console.log('[i18n] Current locale from context:', locale);
    console.log('[i18n] Default locale:', defaultLocale);
    
    // Small delay to ensure everything is loaded
    const timer = setTimeout(() => {
      // Check if cookie exists
      const allCookies = document.cookie;
      const existingCookie = allCookies
        .split('; ')
        .find(row => row.startsWith('NEXT_LOCALE='));

      console.log('[i18n] All cookies:', allCookies);
      console.log('[i18n] Existing NEXT_LOCALE cookie:', existingCookie);

      if (!existingCookie) {
        // No cookie exists - detect browser language and set it
        const { locale: browserLocale, rawLang, langCode } = getBrowserLocale();
        
        console.log('[i18n] No cookie found, detected browser locale:', {
          browserLocale,
          rawLang,
          langCode,
          currentLocale: locale,
          willApply: browserLocale !== locale,
        });
        
        // Set cookie if browser locale is different from current
        if (browserLocale !== locale) {
          console.log('[i18n] Setting cookie and reloading for locale:', browserLocale);
          document.cookie = `NEXT_LOCALE=${browserLocale};path=/;max-age=31536000`;
          window.location.reload();
        } else {
          console.log('[i18n] Browser locale matches current, no action needed');
        }
      } else {
        console.log('[i18n] Cookie already exists, skipping detection');
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [locale]);

  return null; // This component doesn't render anything
}
