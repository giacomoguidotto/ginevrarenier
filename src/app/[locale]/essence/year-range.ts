export function formatYearRange(startYear: number, endYear?: number): string {
  if (endYear != null && endYear !== startYear) {
    return `${startYear}–${endYear}`;
  }
  return String(startYear);
}
