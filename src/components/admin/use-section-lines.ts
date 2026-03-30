"use client";

import type { RefObject } from "react";
import { useCallback, useEffect, useRef } from "react";
import { useEditMode } from "./edit-mode-context";
import { injectSectionLines } from "./edit-mode-lines";

/**
 * Hook for sections to inject architectural lines.
 * Lines appear when BOTH conditions are met:
 *   1. isEditMode is true
 *   2. The section's enter animations have completed (onSectionReady called)
 *
 * When isEditMode becomes false, lines are removed.
 */
export function useSectionLines(sectionRef: RefObject<HTMLElement | null>) {
  const { isEditMode } = useEditMode();
  const readyRef = useRef(false);
  const linesRef = useRef<HTMLElement[]>([]);

  const inject = useCallback(() => {
    if (!sectionRef.current || linesRef.current.length > 0) {
      return;
    }
    linesRef.current = injectSectionLines(sectionRef.current);
  }, [sectionRef]);

  const cleanup = useCallback(() => {
    for (const el of linesRef.current) {
      if (el.style.transform?.includes("scaleX")) {
        el.style.transform = "scaleX(0)";
      } else if (el.style.transform?.includes("scaleY")) {
        el.style.transform = "scaleY(0)";
      } else {
        el.style.opacity = "0";
      }
    }
    setTimeout(() => {
      for (const el of linesRef.current) {
        el.remove();
      }
      linesRef.current = [];
    }, 400);
  }, []);

  // When isEditMode changes: inject if ready, cleanup if exiting
  useEffect(() => {
    if (isEditMode && readyRef.current) {
      requestAnimationFrame(() => inject());
    } else if (!isEditMode && linesRef.current.length > 0) {
      cleanup();
    }
  }, [isEditMode, inject, cleanup]);

  // Callback for motion's onAnimationComplete
  const onSectionReady = useCallback(() => {
    readyRef.current = true;
    if (isEditMode) {
      requestAnimationFrame(() => inject());
    }
  }, [isEditMode, inject]);

  return { onSectionReady };
}
