"use client";

import type { RefObject } from "react";
import { useCallback, useEffect } from "react";
import { exceedsThreshold, shouldPreventInput } from "./field-constraints";

interface UseFieldConstraintsOptions {
  active: boolean;
  maxHeight?: number;
  maxWidth?: number;
  multiline?: boolean;
}

export function useFieldConstraints(
  ref: RefObject<HTMLElement | null>,
  options: UseFieldConstraintsOptions
) {
  const { active, maxHeight, maxWidth, multiline } = options;
  const hasThreshold = maxHeight != null || maxWidth != null;

  const handleBeforeInput = useCallback(
    (e: InputEvent) => {
      if (shouldPreventInput(e.inputType, { multiline })) {
        e.preventDefault();
        return;
      }

      if (!hasThreshold) {
        return;
      }
      if (e.inputType.startsWith("delete")) {
        return;
      }

      const el = ref.current;
      if (!(el && e.data)) {
        return;
      }

      const clone = el.cloneNode(true) as HTMLElement;
      clone.style.position = "fixed";
      clone.style.visibility = "hidden";
      clone.style.pointerEvents = "none";

      const cs = getComputedStyle(el);
      clone.style.width = cs.width;

      clone.textContent = (el.textContent ?? "") + e.data;
      document.body.appendChild(clone);

      const exceeds = exceedsThreshold(
        { scrollHeight: clone.scrollHeight, scrollWidth: clone.scrollWidth },
        { maxHeight, maxWidth }
      );

      clone.remove();

      if (exceeds) {
        e.preventDefault();
      }
    },
    [ref, multiline, hasThreshold, maxHeight, maxWidth]
  );

  useEffect(() => {
    const el = ref.current;
    if (!(el && active)) {
      return;
    }

    el.addEventListener("beforeinput", handleBeforeInput);
    return () => el.removeEventListener("beforeinput", handleBeforeInput);
  }, [ref, active, handleBeforeInput]);

  const style: React.CSSProperties | undefined = multiline
    ? { whiteSpace: "pre-wrap" }
    : undefined;

  return { style };
}
