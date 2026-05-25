export const locales = ["en", "it"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const localeNames: Record<Locale, string> = {
  en: "English",
  it: "Italiano",
};

export const localeFlags: Record<Locale, string> = {
  en: "🇺🇸",
  it: "🇮🇹",
};

export function localePath(locale: Locale | string, path = ""): string {
  const prefix = locale === defaultLocale ? "" : `/${locale}`;
  return `${prefix}${path}`;
}
