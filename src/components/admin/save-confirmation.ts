import type { ChangeSummary } from "./draft-buffer";
import { createStalenessEngine } from "./staleness-engine";

export function formatEditLabel(
  edit: { section: string; field: string },
  sectionLabels: ReadonlyMap<string, string>
): string {
  const label = sectionLabels.get(edit.section) ?? edit.section;
  return `${label} / ${edit.field}`;
}

export function getUndismissedStaleFields(
  summary: Pick<ChangeSummary, "textEdits" | "dismissals" | "autoTranslations">
): { section: string; field: string; locale: string }[] {
  const engine = createStalenessEngine(summary.textEdits, {
    dismissals: summary.dismissals,
    autoTranslations: summary.autoTranslations,
  });
  return engine.staleFields();
}
