"use client";

import { useDraftBufferState } from "./draft-buffer-context";
import { EditToolbar } from "./edit-toolbar";
import { usePageChanges } from "./page-changes-context";

export function EditToolbarWrapper() {
  const pageChanges = usePageChanges();
  const draftBuffer = useDraftBufferState();
  const { changeSummary } = draftBuffer;

  const hasChanges = pageChanges.hasChanges || draftBuffer.hasChanges;

  const editedLocales = new Set(pageChanges.editedLocales);
  for (const edit of changeSummary().textEdits) {
    editedLocales.add(edit.locale);
  }

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
      changeSummary={changeSummary}
      editedLocales={editedLocales}
      hasChanges={hasChanges}
      onDiscard={onDiscard}
      onSave={onSave}
    />
  );
}
