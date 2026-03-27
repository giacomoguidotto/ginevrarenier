"use client";

import { useEffect } from "react";
import { useEditMode } from "./edit-mode-context";

/**
 * Blueprint-style overlay that appears in edit mode.
 * Adds a dot grid overlay and a CSS class to the body for section styling.
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

  if (!isEditMode) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-40 opacity-[0.03]"
      style={{
        backgroundImage:
          "radial-gradient(circle, currentColor 1px, transparent 1px)",
        backgroundSize: "24px 24px",
      }}
    />
  );
}
