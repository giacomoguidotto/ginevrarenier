"use client";

import { useDraftBufferState } from "./draft-buffer-context";
import { EditToolbar } from "./edit-toolbar";

export function EditToolbarWrapper() {
  const draftBuffer = useDraftBufferState();
  const { changeSummary, hasChanges, save, discard } = draftBuffer;

  const editedLocales = new Set<string>();
  for (const edit of changeSummary().textEdits) {
    editedLocales.add(edit.locale);
  }

  return (
    <EditToolbar
      changeSummary={changeSummary}
      editedLocales={editedLocales}
      hasChanges={hasChanges}
      onDiscard={discard}
      onSave={save}
    />
  );
}
