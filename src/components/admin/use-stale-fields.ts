"use client";

import { useDraftBufferState, useEditVersion } from "./draft-buffer-context";
import { createStalenessEngine } from "./staleness-engine";

export function useStaleFields(): {
  field: string;
  locale: string;
  section: string;
}[] {
  const { changeSummary } = useDraftBufferState();
  useEditVersion();
  const summary = changeSummary();
  const engine = createStalenessEngine(summary.textEdits, {
    dismissals: summary.dismissals,
    autoTranslations: summary.autoTranslations,
  });
  return engine.staleFields();
}
