"use client";

import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import type { Locale } from "@/i18n/config";
import { usePathname, useRouter } from "@/i18n/routing";
import { getLocaleRecommendation } from "@/lib/locale-detection";

export const LOCALE_TOAST_STORAGE_KEY = "locale-toast-dismissed";
const ENTRANCE_DELAY = 2000;
const VISIBLE_DURATION = 8000;

export function LocaleToast() {
  const pageLocale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("common.localeToast");
  const [recommendation, setRecommendation] = useState<ReturnType<
    typeof getLocaleRecommendation
  > | null>(null);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(LOCALE_TOAST_STORAGE_KEY)) {
      return;
    }

    const result = getLocaleRecommendation(
      pageLocale,
      navigator.languages ?? [navigator.language]
    );
    if (!result) {
      return;
    }

    setRecommendation(result);

    const entranceTimer = setTimeout(() => setVisible(true), ENTRANCE_DELAY);
    const dismissTimer = setTimeout(() => {
      setDismissed(true);
      localStorage.setItem(LOCALE_TOAST_STORAGE_KEY, "true");
    }, ENTRANCE_DELAY + VISIBLE_DURATION);

    return () => {
      clearTimeout(entranceTimer);
      clearTimeout(dismissTimer);
    };
  }, [pageLocale]);

  const handleClick = useCallback(() => {
    if (!recommendation) {
      return;
    }
    localStorage.setItem(LOCALE_TOAST_STORAGE_KEY, "true");
    router.replace(pathname, { locale: recommendation.suggestedLocale });
  }, [recommendation, router, pathname]);

  if (!recommendation || dismissed) {
    return null;
  }

  return (
    <div
      className="pointer-events-none fixed top-0 right-0 left-0 z-50 flex justify-center"
      role="status"
    >
      <div
        className={`pointer-events-auto mt-4 overflow-hidden rounded-full border border-cream/10 bg-charcoal/90 shadow-lg backdrop-blur-sm transition-all duration-500 ${
          visible ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0"
        }`}
      >
        <button
          className="px-5 py-2.5 text-cream/90 text-sm tracking-wide transition-colors hover:text-cream"
          onClick={handleClick}
          type="button"
        >
          {t(recommendation.suggestedLocale === "it" ? "offerIt" : "offerEn")}
        </button>
        {visible && (
          <div className="h-0.5 w-full bg-cream/5">
            <div
              className="h-full bg-cream/30"
              style={{
                animation: `locale-toast-progress ${VISIBLE_DURATION}ms linear forwards`,
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
