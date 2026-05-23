export type SectionRoute =
  | { kind: "siteContent"; section: string }
  | { kind: "project"; id: string }
  | { kind: "post"; id: string }
  | { kind: "achievement"; id: string };

export function routeSection(section: string): SectionRoute {
  if (section.startsWith("project:")) {
    return { kind: "project", id: section.slice("project:".length) };
  }
  if (section.startsWith("post:")) {
    return { kind: "post", id: section.slice("post:".length) };
  }
  if (section.startsWith("achievement:")) {
    return { kind: "achievement", id: section.slice("achievement:".length) };
  }
  return { kind: "siteContent", section };
}

export function buildEntityUpdates(
  fields: Record<string, Record<string, string>>,
  localized = true
): Record<string, unknown> {
  const updates: Record<string, unknown> = {};
  for (const [field, locales] of Object.entries(fields)) {
    if (!localized || field === "slug" || field === "coverImageUrl") {
      updates[field] = locales.en ?? locales.it;
    } else {
      updates[field] = locales as { en: string; it: string };
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
