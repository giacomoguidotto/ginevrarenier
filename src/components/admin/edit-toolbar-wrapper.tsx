"use client";

import { useCallback, useMemo } from "react";
import { useDraftBufferOps, useDraftBufferState } from "./draft-buffer-context";
import { useEditMode } from "./edit-mode-context";
import { EditToolbar } from "./edit-toolbar";
import { useStaleFields } from "./use-stale-fields";

const stubTranslate = async (text: string, _from: string, to: string) =>
  `[${to}] ${text}`;

export function EditToolbarWrapper() {
  const { changeSummary, hasChanges, save, discard, keepDraft } =
    useDraftBufferState();
  const ops = useDraftBufferOps();
  const staleFields = useStaleFields();
  const { editingLocale } = useEditMode();

  const staleFieldsForLocale = useMemo(
    () => staleFields.filter((f) => f.locale === editingLocale),
    [staleFields, editingLocale]
  );

  const handleAutoTranslate = useCallback(() => {
    ops.autoTranslate(staleFieldsForLocale, stubTranslate);
  }, [ops, staleFieldsForLocale]);

  return (
    <EditToolbar
      changeSummary={changeSummary}
      hasChanges={hasChanges}
      onAutoTranslate={handleAutoTranslate}
      onDiscard={discard}
      onKeepDraft={keepDraft}
      onSave={save}
      staleFieldCountForLocale={staleFieldsForLocale.length}
      staleFields={staleFields}
    />
  );
}
