interface StaleField {
  field: string;
  locale: string;
  section: string;
}

export function staleCountByLocale(
  staleFields: StaleField[]
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const { locale } of staleFields) {
    counts.set(locale, (counts.get(locale) ?? 0) + 1);
  }
  return counts;
}

export function pageHasStaleFields(
  staleFields: StaleField[],
  pageSections: ReadonlyMap<string, string>,
  locale: string
): boolean {
  for (const sf of staleFields) {
    if (sf.locale === locale && pageSections.has(sf.section)) {
      return true;
    }
  }
  return false;
}
