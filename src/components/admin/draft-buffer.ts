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

export interface FieldDeletion {
  keyPrefix: string;
  section: string;
}

export interface PublishOverrideEntry {
  entityType: string;
  id: string;
  published: boolean;
}

export interface ChangeSummary {
  autoTranslations: { section: string; field: string; locale: string }[];
  createdEntities: EntityRef[];
  dismissals: { section: string; field: string; locale: string }[];
  fieldDeletions: FieldDeletion[];
  imageSwaps: ImageSwap[];
  pendingDeletions: EntityRef[];
  publishOverrides: PublishOverrideEntry[];
  reorderedEntityTypes: string[];
  textEdits: TextEdit[];
}

export interface EntityRef {
  entityType: string;
  id: string;
}

export interface SerializedDraftBuffer {
  autoTranslations?: string[];
  creations: string[];
  deletions: string[];
  dismissals?: string[];
  fieldDels: string[];
  publishOverrides?: [string, boolean][];
  reorderLists?: [string, string[]][];
  store: [string, string][];
}

export function createDraftBuffer(initial?: SerializedDraftBuffer) {
  const store = new Map<string, string>(initial?.store);
  const creations = new Set<string>(initial?.creations);
  const deletions = new Set<string>(initial?.deletions);
  const fieldDels = new Set<string>(initial?.fieldDels);
  const pubOverrides = new Map<string, boolean>(initial?.publishOverrides);
  const reorderLists = new Map<string, string[]>(initial?.reorderLists);
  const dismissals = new Set<string>(initial?.dismissals);
  const autoTranslations = new Set<string>(initial?.autoTranslations);

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
      const prefix = `${section}\0${field}\0`;
      const thisKey = `${prefix}${locale}`;
      const hasForOtherLocale = (set: Set<string>) =>
        [...set].some((k) => k.startsWith(prefix) && k !== thisKey);
      if (hasForOtherLocale(dismissals)) {
        for (const k of dismissals) {
          if (k.startsWith(prefix)) {
            dismissals.delete(k);
          }
        }
      }
      if (hasForOtherLocale(autoTranslations)) {
        for (const k of autoTranslations) {
          if (k.startsWith(prefix)) {
            autoTranslations.delete(k);
          }
        }
      }
      store.set(key(section, field, locale), value);
    },
    hasChanges(): boolean {
      return (
        store.size > 0 ||
        creations.size > 0 ||
        deletions.size > 0 ||
        fieldDels.size > 0 ||
        pubOverrides.size > 0 ||
        reorderLists.size > 0
      );
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
    sectionChanges(section: string): Record<string, Record<string, string>> {
      const result: Record<string, Record<string, string>> = {};
      const prefix = `${section}\0`;
      for (const [k, value] of store) {
        if (k.startsWith(prefix)) {
          const rest = k.slice(prefix.length);
          const sep = rest.indexOf("\0");
          const field = rest.slice(0, sep);
          const locale = rest.slice(sep + 1);
          if (!result[field]) {
            result[field] = {};
          }
          result[field][locale] = value;
        }
      }
      return result;
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

      const fds: FieldDeletion[] = [...fieldDels].map((k) => {
        const [section, keyPrefix] = k.split("\0");
        return { section, keyPrefix };
      });

      const pubOvrs: PublishOverrideEntry[] = [...pubOverrides].map(
        ([k, published]) => {
          const [entityType, id] = k.split("\0");
          return { entityType, id, published };
        }
      );

      const toFieldLocaleList = (set: Set<string>) =>
        [...set].map((k) => {
          const [s, f, l] = k.split("\0");
          return { section: s, field: f, locale: l };
        });

      return {
        imageSwaps: [],
        textEdits,
        createdEntities,
        pendingDeletions,
        fieldDeletions: fds,
        publishOverrides: pubOvrs,
        reorderedEntityTypes: [...reorderLists.keys()],
        dismissals: toFieldLocaleList(dismissals),
        autoTranslations: toFieldLocaleList(autoTranslations),
      };
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
    deleteField(section: string, keyPrefix: string): void {
      fieldDels.add(`${section}\0${keyPrefix}`);
    },
    cancelFieldDeletion(section: string, keyPrefix: string): void {
      fieldDels.delete(`${section}\0${keyPrefix}`);
    },
    isFieldDeleted(section: string, keyPrefix: string): boolean {
      return fieldDels.has(`${section}\0${keyPrefix}`);
    },
    fieldDeletions(): { section: string; keyPrefix: string }[] {
      return [...fieldDels].map((k) => {
        const [section, keyPrefix] = k.split("\0");
        return { section, keyPrefix };
      });
    },
    setPublishOverride(
      entityType: string,
      id: string,
      published: boolean
    ): void {
      pubOverrides.set(entityKey(entityType, id), published);
    },
    getPublishOverride(entityType: string, id: string): boolean | undefined {
      return pubOverrides.get(entityKey(entityType, id));
    },
    clearPublishOverride(entityType: string, id: string): void {
      pubOverrides.delete(entityKey(entityType, id));
    },
    publishOverrides(): {
      entityType: string;
      id: string;
      published: boolean;
    }[] {
      return [...pubOverrides].map(([k, published]) => {
        const [entityType, id] = k.split("\0");
        return { entityType, id, published };
      });
    },
    dismiss(section: string, field: string, locale: string): void {
      dismissals.add(key(section, field, locale));
    },
    isDismissed(section: string, field: string, locale: string): boolean {
      return dismissals.has(key(section, field, locale));
    },
    resetDismissal(section: string, field: string): void {
      const prefix = `${section}\0${field}\0`;
      for (const k of dismissals) {
        if (k.startsWith(prefix)) {
          dismissals.delete(k);
        }
      }
    },
    markAutoTranslated(section: string, field: string, locale: string): void {
      autoTranslations.add(key(section, field, locale));
    },
    isAutoTranslated(section: string, field: string, locale: string): boolean {
      return autoTranslations.has(key(section, field, locale));
    },
    setReorderList(entityType: string, ids: string[]): void {
      reorderLists.set(entityType, ids);
    },
    getReorderList(entityType: string): string[] | undefined {
      return reorderLists.get(entityType);
    },
    discard(): void {
      store.clear();
      creations.clear();
      deletions.clear();
      fieldDels.clear();
      pubOverrides.clear();
      reorderLists.clear();
      dismissals.clear();
      autoTranslations.clear();
    },
    serialize(): SerializedDraftBuffer {
      return {
        store: [...store.entries()],
        creations: [...creations],
        deletions: [...deletions],
        fieldDels: [...fieldDels],
        publishOverrides: [...pubOverrides.entries()],
        reorderLists: [...reorderLists.entries()],
        dismissals: [...dismissals],
        autoTranslations: [...autoTranslations],
      };
    },
  };
}
