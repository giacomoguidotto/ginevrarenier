"use client";

import { useDraftBufferState } from "./draft-buffer-context";
import { EditToolbar } from "./edit-toolbar";

export function EditToolbarWrapper() {
  const { changeSummary, editedLocales, hasChanges, save, discard } =
    useDraftBufferState();

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
