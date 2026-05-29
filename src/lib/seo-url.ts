import { defaultLocale, type Locale, localePath, locales } from "@/i18n/config";

export const siteOrigin = "https://ginevrarenier.com";

export function canonicalPath(locale: Locale | string, path = ""): string {
  return localePath(locale === defaultLocale ? defaultLocale : locale, path);
}

export function canonicalUrl(locale: Locale | string, path = ""): string {
  return `${siteOrigin}${canonicalPath(locale, path)}`;
}

export function languageAlternates(path = ""): Record<string, string> {
  return {
    ...Object.fromEntries(
      locales.map((locale) => [locale, canonicalUrl(locale, path)])
    ),
    "x-default": canonicalUrl(defaultLocale, path),
  };
}
