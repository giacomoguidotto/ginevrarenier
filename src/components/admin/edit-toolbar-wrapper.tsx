"use client";

import { EditToolbar } from "./edit-toolbar";
import { usePageChanges } from "./page-changes-context";

export function EditToolbarWrapper() {
  const { hasChanges, save, discard } = usePageChanges();

  return (
    <EditToolbar hasChanges={hasChanges} onDiscard={discard} onSave={save} />
  );
}
