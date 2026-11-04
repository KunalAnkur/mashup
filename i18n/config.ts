// Shared i18n configuration - can be used by both client and server components

export const locales = ['en', 'tr', 'es', 'ar'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

// Language metadata for display in selector
export const languageNames: Record<Locale, { name: string; nativeName: string; flag: string }> = {
  en: { name: 'English', nativeName: 'English', flag: '🇺🇸' },
  tr: { name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷' },
  es: { name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  ar: { name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
};

/**
 * The first supported locale in an Accept-Language header, by the browser's own preference
 * order (q-values), or null when it lists none we have.
 *
 * Used for first-time visitors who haven't picked a language. Without it everyone got English,
 * so Chrome offered (on Android, often applied) its own page translation to Turkish, Spanish
 * and Arabic speakers. That translation rewrites the DOM under React and crashes the app.
 * Serving the real translation removes the reason to translate.
 */
export function localeFromAcceptLanguage(header: string | null | undefined): Locale | null {
  if (!header) return null;

  const ranked = header
    .split(",")
    .map((part, index) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params.map((p) => p.trim()).find((p) => p.startsWith("q="));
      const quality = q ? Number(q.slice(2)) : 1;
      return { code: tag.toLowerCase().split("-")[0], quality: Number.isNaN(quality) ? 0 : quality, index };
    })
    .filter((entry) => entry.code && entry.quality > 0)
    // Higher q first; equal q keeps the order the browser sent.
    .sort((a, b) => b.quality - a.quality || a.index - b.index);

  for (const { code } of ranked) {
    if ((locales as readonly string[]).includes(code)) return code as Locale;
  }
  return null;
}

// RTL languages
export const rtlLocales: Locale[] = ['ar'];

export function isRtlLocale(locale: Locale): boolean {
  return rtlLocales.includes(locale);
}
