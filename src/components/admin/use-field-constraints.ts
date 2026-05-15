"use client";

import type { RefObject } from "react";
import { useCallback, useEffect } from "react";
import { exceedsThreshold, shouldPreventInput } from "./field-constraints";

interface UseFieldConstraintsOptions {
  active: boolean;
  maxHeight?: number;
  maxLines?: number;
  maxWidth?: number;
  multiline?: boolean;
}

export function useFieldConstraints(
  ref: RefObject<HTMLElement | null>,
  options: UseFieldConstraintsOptions
) {
  const { active, maxHeight, maxLines, maxWidth, multiline } = options;
  const effectiveMultiline = multiline || (maxLines != null && maxLines > 1);
  const hasThreshold =
    maxHeight != null || maxWidth != null || maxLines != null;

  const handleBeforeInput = useCallback(
    (e: InputEvent) => {
      const el = ref.current;
      if (
        shouldPreventInput(e.inputType, {
          multiline: effectiveMultiline,
          maxLines,
          currentText: el?.textContent ?? "",
        })
      ) {
        e.preventDefault();
        return;
      }

      if (!hasThreshold) {
        return;
      }
      if (e.inputType.startsWith("delete")) {
        return;
      }

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

      let effectiveMaxHeight = maxHeight;
      if (maxLines != null) {
        let lineHeight = Number.parseFloat(cs.lineHeight);
        if (Number.isNaN(lineHeight)) {
          lineHeight = Number.parseFloat(cs.fontSize) * 1.2;
        }
        effectiveMaxHeight = lineHeight * maxLines + 1;
      }

      const exceeds = exceedsThreshold(
        { scrollHeight: clone.scrollHeight, scrollWidth: clone.scrollWidth },
        { maxHeight: effectiveMaxHeight, maxWidth }
      );

      clone.remove();

      if (exceeds) {
        e.preventDefault();
      }
    },
    [ref, effectiveMultiline, maxLines, hasThreshold, maxHeight, maxWidth]
  );

  useEffect(() => {
    const el = ref.current;
    if (!(el && active)) {
      return;
    }

    el.addEventListener("beforeinput", handleBeforeInput);
    return () => el.removeEventListener("beforeinput", handleBeforeInput);
  }, [ref, active, handleBeforeInput]);

  const style: React.CSSProperties | undefined = effectiveMultiline
    ? { whiteSpace: "pre-wrap" }
    : undefined;

  return { style };
}
