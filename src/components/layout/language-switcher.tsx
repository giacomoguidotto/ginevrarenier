"use client";

import { useLocale } from "next-intl";
import { type Locale, localeNames, locales } from "@/i18n/config";
import { usePathname, useRouter } from "@/i18n/routing";
import { LOCALE_TOAST_STORAGE_KEY } from "./locale-toast";

export function LanguageSwitcher() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();

  const handleLocaleChange = async (newLocale: Locale) => {
    if ("cookieStore" in window) {
      const oneYearFromNow = Date.now() + 365 * 24 * 60 * 60 * 1000;
      await window.cookieStore.set({
        name: "NEXT_LOCALE",
        value: newLocale,
        path: "/",
        expires: oneYearFromNow,
      });
    }
    localStorage.setItem(LOCALE_TOAST_STORAGE_KEY, "true");
    router.replace(pathname, { locale: newLocale });
  };

  return (
    <div className="flex flex-wrap items-center gap-1 text-xs">
      {locales.map((loc) => (
        <button
          aria-current={locale === loc || undefined}
          aria-label={`Switch to ${localeNames[loc]}`}
          className={`rounded px-1.5 py-0.5 uppercase tracking-widest transition-colors ${
            locale === loc
              ? "bg-cream/10 text-cream"
              : "text-cream/50 hover:bg-cream/5 hover:text-cream/80"
          }`}
          key={loc}
          onClick={() => handleLocaleChange(loc)}
          type="button"
        >
          {loc}
        </button>
      ))}
    </div>
  );
}
