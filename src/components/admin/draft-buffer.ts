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
  createdEntities: EntityRef[];
  imageSwaps: ImageSwap[];
  pendingDeletions: EntityRef[];
  textEdits: TextEdit[];
}

export interface EntityRef {
  entityType: string;
  id: string;
}

export function createDraftBuffer() {
  const store = new Map<string, string>();
  const creations = new Set<string>();
  const deletions = new Set<string>();

  function key(section: string, field: string, locale: string) {
    return `${section}\0${field}\0${locale}`;
  }

  function entityKey(entityType: string, id: string) {
    return `${entityType}\0${id}`;
  }

  return {
    read(section: string, field: string, locale: string): string | undefined {
      return store.get(key(section, field, locale));
    },
    write(section: string, field: string, locale: string, value: string): void {
      store.set(key(section, field, locale), value);
    },
    hasChanges(): boolean {
      return store.size > 0 || creations.size > 0 || deletions.size > 0;
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

      const createdEntities: EntityRef[] = [];
      for (const k of creations) {
        const [entityType, id] = k.split("\0");
        createdEntities.push({ entityType, id });
      }

      const pendingDeletions: EntityRef[] = [];
      for (const k of deletions) {
        const [entityType, id] = k.split("\0");
        pendingDeletions.push({ entityType, id });
      }

      return { imageSwaps: [], textEdits, createdEntities, pendingDeletions };
    },
    editedLocales(section: string, field: string): Set<string> {
      const prefix = `${section}\0${field}\0`;
      const locales = new Set<string>();
      for (const k of store.keys()) {
        if (k.startsWith(prefix)) {
          locales.add(k.slice(prefix.length));
        }
      }
      return locales;
    },
    trackCreation(entityType: string, id: string): void {
      creations.add(entityKey(entityType, id));
    },
    isSessionCreated(entityType: string, id: string): boolean {
      return creations.has(entityKey(entityType, id));
    },
    trackDeletion(entityType: string, id: string): void {
      deletions.add(entityKey(entityType, id));
    },
    isPendingDeletion(entityType: string, id: string): boolean {
      return deletions.has(entityKey(entityType, id));
    },
    cancelDeletion(entityType: string, id: string): void {
      deletions.delete(entityKey(entityType, id));
    },
    creations(): EntityRef[] {
      return [...creations].map((k) => {
        const [entityType, id] = k.split("\0");
        return { entityType, id };
      });
    },
    deletions(): EntityRef[] {
      return [...deletions].map((k) => {
        const [entityType, id] = k.split("\0");
        return { entityType, id };
      });
    },
    discard(): void {
      store.clear();
      creations.clear();
      deletions.clear();
    },
  };
}
