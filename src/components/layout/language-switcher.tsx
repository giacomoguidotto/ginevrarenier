"use client";

import { useLocale } from "next-intl";
import { type Locale, locales } from "@/i18n/config";
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
    <div className="flex items-center gap-1 text-xs">
      {locales.map((loc, index) => (
        <span className="flex items-center" key={loc}>
          {index > 0 && <span className="mx-1.5 text-cream/30">|</span>}
          <button
            aria-label={`Switch to ${loc === "en" ? "English" : "Italian"}`}
            className={`uppercase tracking-widest transition-colors ${
              locale === loc
                ? "text-cream"
                : "text-cream/50 hover:text-cream/80"
            }`}
            onClick={() => handleLocaleChange(loc)}
            type="button"
          >
            {loc}
          </button>
        </span>
      ))}
    </div>
  );
}
