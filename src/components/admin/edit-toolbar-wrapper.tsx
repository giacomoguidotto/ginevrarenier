"use client";

import { EditToolbar } from "./edit-toolbar";
import { usePageChanges } from "./page-changes-context";

export function EditToolbarWrapper() {
  const { hasChanges, editedLocales, save, discard } = usePageChanges();

  return (
    <EditToolbar
      editedLocales={editedLocales}
      hasChanges={hasChanges}
      onDiscard={discard}
      onSave={save}
    />
  );
}
