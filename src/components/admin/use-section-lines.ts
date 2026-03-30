"use client";

import type { RefObject } from "react";
import { useCallback, useRef } from "react";
import { useEditMode } from "./edit-mode-context";
import { injectSectionLines } from "./edit-mode-lines";

/**
 * Hook for sections to inject architectural lines when their
 * enter animations complete. Returns a callback to pass to
 * the last motion element's onAnimationComplete.
 *
 * @param sectionRef - ref to the section element
 */
export function useSectionLines(sectionRef: RefObject<HTMLElement | null>) {
  const { isEditMode } = useEditMode();
  const injectedRef = useRef(false);

  const onAnimationComplete = useCallback(() => {
    if (!isEditMode || injectedRef.current || !sectionRef.current) {
      return;
    }
    injectedRef.current = true;
    requestAnimationFrame(() => {
      if (sectionRef.current) {
        injectSectionLines(sectionRef.current);
      }
    });
  }, [isEditMode, sectionRef]);

  return { onSectionReady: onAnimationComplete };
}
