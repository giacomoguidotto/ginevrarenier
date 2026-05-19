import { locales } from "@/i18n/config";
import type { TextEdit } from "./draft-buffer";

export function createStalenessEngine(textEdits: TextEdit[]) {
  const edited = new Set<string>();
  const fields = new Set<string>();
  for (const edit of textEdits) {
    edited.add(`${edit.section}\0${edit.field}\0${edit.locale}`);
    fields.add(`${edit.section}\0${edit.field}`);
  }

  function isStale(section: string, field: string, locale: string): boolean {
    if (edited.has(`${section}\0${field}\0${locale}`)) {
      return false;
    }
    return locales.some(
      (l) => l !== locale && edited.has(`${section}\0${field}\0${l}`)
    );
  }

  return {
    isStale,
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
