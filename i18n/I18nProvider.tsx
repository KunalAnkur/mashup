"use client";

import { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from "react";
import { locales, defaultLocale, type Locale } from "./config";

// Import all messages statically
import enMessages from "./messages/en.json";
import trMessages from "./messages/tr.json";
import esMessages from "./messages/es.json";
import arMessages from "./messages/ar.json";

const messagesByLocale: Record<Locale, typeof enMessages> = {
  en: enMessages,
  tr: trMessages,
  es: esMessages,
  ar: arMessages,
};

type Messages = typeof enMessages;
type NestedKeyOf<T> = T extends object
  ? { [K in keyof T]: K extends string ? (T[K] extends object ? `${K}.${NestedKeyOf<T[K]>}` : K) : never }[keyof T]
  : never;

interface I18nContextType {
  locale: Locale;
  messages: Messages;
  t: (key: string, params?: Record<string, string | number>) => string;
  setLocale: (locale: Locale) => void;
}

const I18nContext = createContext<I18nContextType | null>(null);

function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const keys = path.split(".");
  let result: unknown = obj;
  
  for (const key of keys) {
    if (result && typeof result === "object" && key in result) {
      result = (result as Record<string, unknown>)[key];
    } else {
      return path; // Return key if not found
    }
  }
  
  return typeof result === "string" ? result : path;
}

function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    return params[key]?.toString() ?? `{${key}}`;
  });
}

interface I18nProviderProps {
  children: ReactNode;
  initialLocale?: Locale;
}

export function I18nProvider({ children, initialLocale }: I18nProviderProps) {
  console.log('[I18nProvider] Initializing with initialLocale:', initialLocale);
  
  const [locale, setLocaleState] = useState<Locale>(initialLocale || defaultLocale);
  const [messages, setMessages] = useState<Messages>(messagesByLocale[initialLocale || defaultLocale]);

  // Read locale from cookie on mount (client-side only)
  // Sync with cookie if it differs from current state (e.g., if cookie was set after initial render)
  useEffect(() => {
    console.log('[I18nProvider] useEffect running, checking cookies...');
    const cookies = document.cookie.split(";");
    console.log('[I18nProvider] All cookies:', document.cookie);
    const localeCookie = cookies.find((c) => c.trim().startsWith("NEXT_LOCALE="));
    console.log('[I18nProvider] Found locale cookie:', localeCookie);
    
    if (localeCookie) {
      const value = localeCookie.split("=")[1].trim() as Locale;
      console.log('[I18nProvider] Cookie value:', value, 'Current locale:', locale);
      // Update if cookie value is valid and different from current locale state
      // This ensures client-side state matches cookie even if server-side initialLocale was different
      if (locales.includes(value) && value !== locale) {
        console.log('[I18nProvider] Updating locale from', locale, 'to', value);
        setLocaleState(value);
        setMessages(messagesByLocale[value]);
      } else {
        console.log('[I18nProvider] No update needed, locale matches or invalid');
      }
    } else {
      console.log('[I18nProvider] No NEXT_LOCALE cookie found');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  const setLocale = useCallback((newLocale: Locale) => {
    if (locales.includes(newLocale)) {
      // Set cookie
      document.cookie = `NEXT_LOCALE=${newLocale};path=/;max-age=31536000`;
      // Reload to apply changes (including RTL direction)
      window.location.reload();
    }
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const value = getNestedValue(messages as unknown as Record<string, unknown>, key);
      return interpolate(value, params);
    },
    [messages]
  );

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({ locale, messages, t, setLocale }),
    [locale, messages, t, setLocale]
  );

  return (
    <I18nContext.Provider value={contextValue}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslations(namespace?: string) {
  const context = useContext(I18nContext);
  
  if (!context) {
    throw new Error("useTranslations must be used within an I18nProvider");
  }

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const fullKey = namespace ? `${namespace}.${key}` : key;
      return context.t(fullKey, params);
    },
    [context, namespace]
  );

  return t;
}

export function useLocale(): Locale {
  const context = useContext(I18nContext);
  
  if (!context) {
    throw new Error("useLocale must be used within an I18nProvider");
  }

  return context.locale;
}

export function useI18n() {
  const context = useContext(I18nContext);
  
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider");
  }

  return context;
}
