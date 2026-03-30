"use client";

import { useEffect } from "react";
import { useEditMode } from "./edit-mode-context";

/**
 * Edit mode visual cues — purely CSS-driven.
 * Toggles body.edit-mode class which activates CSS rules in globals.css.
 * Lines are rendered via CSS pseudo-elements and outlines on actual DOM
 * elements, so they scroll naturally and need no JS position tracking.
 */
export function EditModeLines() {
  const { isEditMode } = useEditMode();

  useEffect(() => {
    if (isEditMode) {
      document.body.classList.add("edit-mode");
    } else {
      document.body.classList.remove("edit-mode");
    }
    return () => {
      document.body.classList.remove("edit-mode");
    };
  }, [isEditMode]);

  return null;
}
