export interface TimelineEntry {
  id: string;
}

export interface EntryWrite {
  field: string;
  locale: string;
  value: string;
}

export function createEntryWrites(id: string, year: string): EntryWrite[] {
  return [
    { field: `${id}.year`, locale: "en", value: year },
    { field: `${id}.year`, locale: "it", value: year },
    { field: `${id}.title`, locale: "en", value: "" },
    { field: `${id}.title`, locale: "it", value: "" },
    { field: `${id}.description`, locale: "en", value: "" },
    { field: `${id}.description`, locale: "it", value: "" },
  ];
}

export function deriveBufferedEntries(
  data: Record<string, { en: string; it: string }> | undefined,
  sectionChanges: Record<string, Record<string, string>>,
  isFieldDeleted: (prefix: string) => boolean
): TimelineEntry[] {
  const deletedPrefixes = new Set<string>();
  const allKeys = new Set<string>();
  if (data) {
    for (const key of Object.keys(data)) {
      allKeys.add(key);
    }
  }
  for (const key of Object.keys(sectionChanges)) {
    allKeys.add(key);
  }
  for (const key of allKeys) {
    if (key.endsWith(".title")) {
      const prefix = key.slice(0, key.lastIndexOf("."));
      if (isFieldDeleted(prefix)) {
        deletedPrefixes.add(prefix);
      }
    }
  }
  return deriveTimelineEntries(data, deletedPrefixes, sectionChanges);
}

export function deriveTimelineEntries(
  data: Record<string, { en: string; it: string }> | undefined,
  deletedPrefixes?: Set<string>,
  draftWrites?: Record<string, Record<string, string>>
): TimelineEntry[] {
  const allKeys = new Set<string>();

  if (data) {
    for (const key of Object.keys(data)) {
      allKeys.add(key);
    }
  }
  if (draftWrites) {
    for (const key of Object.keys(draftWrites)) {
      allKeys.add(key);
    }
  }

  const ids = new Set<string>();
  for (const key of allKeys) {
    if (key.endsWith(".title") && key.includes(".")) {
      const prefix = key.slice(0, key.lastIndexOf("."));
      if (deletedPrefixes?.has(prefix)) {
        continue;
      }
      const hasYear =
        data?.[`${prefix}.year`] || draftWrites?.[`${prefix}.year`];
      if (hasYear) {
        ids.add(prefix);
      }
    }
  }

  const yearValue = (id: string): string =>
    draftWrites?.[`${id}.year`]?.en ?? data?.[`${id}.year`]?.en ?? "";

  return [...ids]
    .sort((a, b) => yearValue(a).localeCompare(yearValue(b)))
    .map((id) => ({ id }));
}
