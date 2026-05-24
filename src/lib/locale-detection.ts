import { defaultLocale, type Locale, locales } from "@/i18n/config";

export interface LocaleRecommendation {
  suggestedLocale: Locale;
}

export function getLocaleRecommendation(
  pageLocale: Locale,
  browserLanguages: readonly string[]
): LocaleRecommendation | null {
  const detectedLocale = browserLanguages
    .map((lang) => lang.split("-")[0].toLowerCase())
    .find((lang): lang is Locale => locales.includes(lang as Locale));

  if (detectedLocale) {
    if (detectedLocale === pageLocale) {
      return null;
    }
    return { suggestedLocale: detectedLocale };
  }

  if (pageLocale !== defaultLocale) {
    return { suggestedLocale: defaultLocale };
  }

  return null;
}
