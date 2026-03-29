"use client";

import { useEffect } from "react";
import { useEditMode } from "./edit-mode-context";

/**
 * Architectural blueprint overlay for edit mode.
 * Renders a fine technical grid, edge rulers, and coordinate marks
 * that transform the page into a living CAD drawing.
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
    <>
      {/* Fine technical grid — crosshatch pattern */}
      <div
        aria-hidden="true"
        className="blueprint-grid pointer-events-none fixed inset-0 z-40"
      />

      {/* Left ruler with tick marks */}
      <div
        aria-hidden="true"
        className="blueprint-ruler-left pointer-events-none fixed top-0 bottom-0 left-0 z-40 w-4"
      />

      {/* Top ruler with tick marks */}
      <div
        aria-hidden="true"
        className="blueprint-ruler-top pointer-events-none fixed top-0 right-0 left-0 z-40 h-4"
      />

      {/* Corner registration marks */}
      <svg
        aria-hidden="true"
        className="pointer-events-none fixed top-3 left-3 z-40 h-6 w-6 text-[var(--blueprint)]"
      >
        <path
          d="M0 6 L0 0 L6 0"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
        />
      </svg>
      <svg
        aria-hidden="true"
        className="pointer-events-none fixed top-3 right-3 z-40 h-6 w-6 text-[var(--blueprint)]"
      >
        <path
          d="M18 0 L24 0 L24 6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
        />
      </svg>
      <svg
        aria-hidden="true"
        className="pointer-events-none fixed bottom-3 left-3 z-40 h-6 w-6 text-[var(--blueprint)]"
      >
        <path
          d="M0 18 L0 24 L6 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
        />
      </svg>
      <svg
        aria-hidden="true"
        className="pointer-events-none fixed right-3 bottom-3 z-40 h-6 w-6 text-[var(--blueprint)]"
      >
        <path
          d="M18 24 L24 24 L24 18"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
        />
      </svg>

      {/* Center crosshair */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed top-1/2 left-1/2 z-40 -translate-x-1/2 -translate-y-1/2"
      >
        <div className="h-px w-8 bg-[var(--blueprint)] opacity-20" />
        <div className="absolute top-1/2 left-1/2 h-8 w-px -translate-x-1/2 -translate-y-1/2 bg-[var(--blueprint)] opacity-20" />
      </div>
    </>
  );
}
