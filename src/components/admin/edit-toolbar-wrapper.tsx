"use client";

import { EditToolbar } from "./edit-toolbar";

// biome-ignore lint/suspicious/noEmptyBlockStatements: stub until Phase 6
const noop = () => {};

/**
 * Wrapper for EditToolbar that manages page-level save/discard state.
 * Save and discard will be wired to Convex mutations in Phase 6.
 */
export function EditToolbarWrapper() {
  return <EditToolbar hasChanges={false} onDiscard={noop} onSave={noop} />;
}
