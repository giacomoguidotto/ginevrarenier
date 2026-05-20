import type { ChangeSummary } from "./draft-buffer";
import { createStalenessEngine } from "./staleness-engine";

const GENERATED_ID_RE = /^[a-z0-9]{4,8}$/;
const HAS_DIGIT_RE = /\d/;

function humanizeFieldName(field: string): string {
  const dot = field.indexOf(".");
  if (dot === -1) {
    return field;
  }
  const prefix = field.slice(0, dot);
  if (GENERATED_ID_RE.test(prefix) && HAS_DIGIT_RE.test(prefix)) {
    return field.slice(dot + 1);
  }
  return field;
}

export function formatEditLabel(
  edit: { section: string; field: string },
  sectionLabels: ReadonlyMap<string, string>
): string {
  const label = sectionLabels.get(edit.section) ?? edit.section;
  return `${label} / ${humanizeFieldName(edit.field)}`;
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
