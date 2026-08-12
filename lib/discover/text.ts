import type { Localized } from "./types";

/**
 * The best available string for a locale.
 *
 * English is the fallback for every other language — the same rule the Sanity schema
 * enforces by making `en` the only required box, and the same one arcade uses for image
 * titles. Blank strings are treated as missing: a translator's empty field must not win
 * over English and show a Turkish reader nothing at all.
 */
export function textOf(value: Localized | undefined, locale: string): string {
  if (!value) return "";
  const exact = value[locale]?.trim();
  if (exact) return exact;
  const english = value["en"]?.trim();
  return english ?? "";
}
