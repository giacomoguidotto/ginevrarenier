import { locales } from "@/i18n/config";
import type { TextEdit } from "./draft-buffer";

export type FieldStatus = "fresh" | "stale" | "dismissed" | "system-filled";

interface FieldLocale {
  field: string;
  locale: string;
  section: string;
}

interface StalenessOptions {
  autoTranslations?: FieldLocale[];
  dismissals?: FieldLocale[];
}

export function createStalenessEngine(
  textEdits: TextEdit[],
  options?: StalenessOptions
) {
  const edited = new Set<string>();
  const fields = new Set<string>();
  for (const edit of textEdits) {
    edited.add(`${edit.section}\0${edit.field}\0${edit.locale}`);
    fields.add(`${edit.section}\0${edit.field}`);
  }

  const dismissed = new Set<string>(
    options?.dismissals?.map((d) => `${d.section}\0${d.field}\0${d.locale}`)
  );
  const autoTranslated = new Set<string>(
    options?.autoTranslations?.map(
      (a) => `${a.section}\0${a.field}\0${a.locale}`
    )
  );

  function isStaleRaw(section: string, field: string, locale: string): boolean {
    if (edited.has(`${section}\0${field}\0${locale}`)) {
      return false;
    }
    return locales.some(
      (l) => l !== locale && edited.has(`${section}\0${field}\0${l}`)
    );
  }

  function fieldStatus(
    section: string,
    field: string,
    locale: string
  ): FieldStatus {
    const key = `${section}\0${field}\0${locale}`;
    if (dismissed.has(key)) {
      return "dismissed";
    }
    if (autoTranslated.has(key)) {
      return "system-filled";
    }
    if (isStaleRaw(section, field, locale)) {
      return "stale";
    }
    return "fresh";
  }

  function isStale(section: string, field: string, locale: string): boolean {
    return fieldStatus(section, field, locale) === "stale";
  }

  return {
    isStale,
    fieldStatus,
    staleFields(): { section: string; field: string; locale: string }[] {
      const result: { section: string; field: string; locale: string }[] = [];
      for (const key of fields) {
        const [section, field] = key.split("\0");
        for (const locale of locales) {
          if (isStale(section, field, locale)) {
            result.push({ section, field, locale });
          }
        }
      }
      return result;
    },
  };
}
