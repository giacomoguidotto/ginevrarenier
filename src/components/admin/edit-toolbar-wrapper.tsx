"use client";

import { useDraftBufferState } from "./draft-buffer-context";
import { EditToolbar } from "./edit-toolbar";
import { useStaleFields } from "./use-stale-fields";

export function EditToolbarWrapper() {
  const { changeSummary, hasChanges, save, discard } = useDraftBufferState();
  const staleFields = useStaleFields();

  return (
    <EditToolbar
      changeSummary={changeSummary}
      hasChanges={hasChanges}
      onDiscard={discard}
      onSave={save}
      staleFields={staleFields}
    />
  );
}
