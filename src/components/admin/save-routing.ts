export function buildEntityUpdates(
  fields: Record<string, Record<string, string>>,
  localized = true,
  existingData?: Record<string, Record<string, string>>
): Record<string, unknown> {
  const updates: Record<string, unknown> = {};
  for (const [field, locales] of Object.entries(fields)) {
    if (
      !localized ||
      field === "slug" ||
      field === "coverImageUrl" ||
      field === "coverImagePublicId"
    ) {
      updates[field] = locales.en ?? locales.it;
    } else {
      const existing = existingData?.[field];
      updates[field] = existing
        ? { ...existing, ...locales }
        : (locales as { en: string; it: string });
    }
  }
  return updates;
}

export function mergeSiteContent(
  fields: Record<string, Record<string, string>>,
  existing: Record<string, { en: string; it: string }>
): Record<string, { en: string; it: string }> {
  const merged: Record<string, { en: string; it: string }> = {};
  for (const [field, locales] of Object.entries(fields)) {
    const current = existing[field] ?? { en: "", it: "" };
    merged[field] = { ...current, ...locales } as { en: string; it: string };
  }
  return merged;
}
