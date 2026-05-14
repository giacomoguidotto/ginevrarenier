export interface TextEdit {
  field: string;
  locale: string;
  newValue: string;
  oldValue: string | undefined;
  section: string;
}

export interface ImageSwap {
  publicId: string;
}

export interface ChangeSummary {
  imageSwaps: ImageSwap[];
  textEdits: TextEdit[];
}

export function createDraftBuffer() {
  const store = new Map<string, string>();

  function key(section: string, field: string, locale: string) {
    return `${section}\0${field}\0${locale}`;
  }

  return {
    read(section: string, field: string, locale: string): string | undefined {
      return store.get(key(section, field, locale));
    },
    write(section: string, field: string, locale: string, value: string): void {
      store.set(key(section, field, locale), value);
    },
    hasChanges(): boolean {
      return store.size > 0;
    },
    changes(): Map<string, Record<string, Record<string, string>>> {
      const grouped = new Map<string, Record<string, Record<string, string>>>();
      for (const [k, value] of store) {
        const [section, field, locale] = k.split("\0");
        let sectionMap = grouped.get(section);
        if (!sectionMap) {
          sectionMap = {};
          grouped.set(section, sectionMap);
        }
        if (!sectionMap[field]) {
          sectionMap[field] = {};
        }
        sectionMap[field][locale] = value;
      }
      return grouped;
    },
    changeSummary(
      getOriginal?: (
        section: string,
        field: string,
        locale: string
      ) => string | undefined
    ): ChangeSummary {
      const textEdits: TextEdit[] = [];
      for (const [k, value] of store) {
        const [section, field, locale] = k.split("\0");
        textEdits.push({
          section,
          field,
          locale,
          oldValue: getOriginal?.(section, field, locale),
          newValue: value,
        });
      }
      return { imageSwaps: [], textEdits };
    },
    discard(): void {
      store.clear();
    },
  };
}
