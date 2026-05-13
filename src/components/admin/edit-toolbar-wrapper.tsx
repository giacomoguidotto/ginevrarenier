"use client";

import { useDraftBufferState } from "./draft-buffer-context";
import { EditToolbar } from "./edit-toolbar";
import { usePageChanges } from "./page-changes-context";

export function EditToolbarWrapper() {
  const pageChanges = usePageChanges();
  const draftBuffer = useDraftBufferState();

  const hasChanges = pageChanges.hasChanges || draftBuffer.hasChanges;

  const onSave = async () => {
    await pageChanges.save();
    await draftBuffer.save();
  };

  const onDiscard = () => {
    pageChanges.discard();
    draftBuffer.discard();
  };

  return (
    <EditToolbar
      changeSummary={draftBuffer.changeSummary}
      editedLocales={pageChanges.editedLocales}
      hasChanges={hasChanges}
      onDiscard={onDiscard}
      onSave={onSave}
    />
  );
}
