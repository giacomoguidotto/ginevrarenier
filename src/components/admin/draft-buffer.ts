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

export interface PublishOverrideEntry {
  entityType: string;
  id: string;
  published: boolean;
}

export interface SelectionOverrideEntry {
  projectId: string;
  selected: boolean;
}

export interface ChangeSummary {
  autoTranslations: { section: string; field: string; locale: string }[];
  createdEntities: EntityRef[];
  dismissals: { section: string; field: string; locale: string }[];
  imageSwaps: ImageSwap[];
  pendingDeletions: EntityRef[];
  publishOverrides: PublishOverrideEntry[];
  reorderedEntityTypes: string[];
  selectionOverrides: SelectionOverrideEntry[];
  textEdits: TextEdit[];
}

export interface EntityRef {
  entityType: string;
  id: string;
}

export const DRAFT_BUFFER_VERSION = 2;

export interface SerializedDraftBuffer {
  autoTranslations?: string[];
  creations: string[];
  deletions: string[];
  dismissals?: string[];
  publishOverrides?: [string, boolean][];
  reorderLists?: [string, string[]][];
  selectionOverrides?: [string, boolean][];
  store: [string, string][];
  version: number;
}

export function createDraftBuffer(initial?: SerializedDraftBuffer) {
  const store = new Map<string, string>(initial?.store);
  const creations = new Set<string>(initial?.creations);
  const deletions = new Set<string>(initial?.deletions);
  const pubOverrides = new Map<string, boolean>(initial?.publishOverrides);
  const selOverrides = new Map<string, boolean>(initial?.selectionOverrides);
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
      autoTranslations.delete(thisKey);
      if (hasForOtherLocale(autoTranslations)) {
        for (const k of autoTranslations) {
          if (k.startsWith(prefix)) {
            autoTranslations.delete(k);
            store.delete(k);
          }
        }
      }
      store.set(key(section, field, locale), value);
    },
    removeEdit(section: string, field: string, locale: string): void {
      store.delete(key(section, field, locale));
    },
    hasChanges(): boolean {
      return (
        store.size > 0 ||
        creations.size > 0 ||
        deletions.size > 0 ||
        pubOverrides.size > 0 ||
        selOverrides.size > 0 ||
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

      const selOvrs: SelectionOverrideEntry[] = [...selOverrides].map(
        ([projectId, selected]) => ({ projectId, selected })
      );

      return {
        imageSwaps: [],
        textEdits,
        createdEntities,
        pendingDeletions,
        publishOverrides: pubOvrs,
        selectionOverrides: selOvrs,
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
    cancelCreation(entityType: string, id: string): void {
      creations.delete(entityKey(entityType, id));
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
    setSelectionOverride(projectId: string, selected: boolean): void {
      selOverrides.set(projectId, selected);
    },
    getSelectionOverride(projectId: string): boolean | undefined {
      return selOverrides.get(projectId);
    },
    clearSelectionOverride(projectId: string): void {
      selOverrides.delete(projectId);
    },
    selectionOverrides(): SelectionOverrideEntry[] {
      return [...selOverrides].map(([projectId, selected]) => ({
        projectId,
        selected,
      }));
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
      pubOverrides.clear();
      selOverrides.clear();
      reorderLists.clear();
      dismissals.clear();
      autoTranslations.clear();
    },
    serialize(): SerializedDraftBuffer {
      return {
        version: DRAFT_BUFFER_VERSION,
        store: [...store.entries()],
        creations: [...creations],
        deletions: [...deletions],
        publishOverrides: [...pubOverrides.entries()],
        selectionOverrides: [...selOverrides.entries()],
        reorderLists: [...reorderLists.entries()],
        dismissals: [...dismissals],
        autoTranslations: [...autoTranslations],
      };
    },
  };
}
