"use client";

import { api } from "convex/_generated/api";
import { useQuery } from "convex/react";
import { useLocale } from "next-intl";
import { useCallback } from "react";
import { useEditMode } from "@/components/admin/edit-mode-context";
import { usePageChanges } from "@/components/admin/page-changes-context";
import type { Locale } from "@/i18n/config";

/**
 * Hook for editable site content sections.
 * Returns the current value (draft if editing, otherwise from Convex)
 * and an onChange handler for EditableText components.
 */
export function useEditableSiteContent(section: string) {
  const pageLocale = useLocale() as Locale;
  const { isEditMode, editingLocale } = useEditMode();
  const locale = isEditMode ? editingLocale : pageLocale;
  const data = useQuery(api.siteContent.getBySection, { section });
  const { trackSiteContent, getSiteContentDraft } = usePageChanges();

  const get = useCallback(
    (key: string): { en: string; it: string } => {
      // Draft takes priority over Convex data
      const draft = getSiteContentDraft(section, key);
      if (draft) {
        return draft;
      }
      return data?.content?.[key] ?? { en: "", it: "" };
    },
    [data, section, getSiteContentDraft]
  );

  const t = useCallback(
    (key: string): string => {
      const field = get(key);
      return field[locale] || field.en;
    },
    [get, locale]
  );

  const set = useCallback(
    (key: string, newValue: { en: string; it: string }) => {
      trackSiteContent(section, key, newValue, locale);
    },
    [section, trackSiteContent, locale]
  );

  /** Returns props object for EditableText: { value, onChange, fieldId } */
  const bind = useCallback(
    (key: string) => ({
      value: get(key),
      onChange: (v: { en: string; it: string }) => set(key, v),
      fieldId: `${section}:${key}`,
    }),
    [get, set, section]
  );

  return { get, t, set, bind, isLoading: data === undefined };
}
