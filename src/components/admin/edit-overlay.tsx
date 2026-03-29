"use client";

import { useEffect } from "react";
import { useEditMode } from "./edit-mode-context";

/**
 * Minimal edit mode overlay.
 * Just toggles the body class — all visuals are CSS-driven.
 */
export function EditOverlay() {
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
