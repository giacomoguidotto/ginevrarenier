"use client";

import type { RefObject } from "react";
import { useCallback, useEffect } from "react";
import { exceedsThreshold, shouldPreventInput } from "./field-constraints";

const NON_DIGIT = /\D/;

interface UseFieldConstraintsOptions {
  active: boolean;
  maxHeight?: number;
  maxLength?: number;
  maxLines?: number;
  maxWidth?: number;
  multiline?: boolean;
  numericOnly?: boolean;
}

function shouldPreventValueInput(
  el: HTMLElement,
  data: string | null,
  inputType: string,
  opts: { maxLength?: number; numericOnly?: boolean }
): boolean {
  if (opts.numericOnly && data && NON_DIGIT.test(data)) {
    return true;
  }
  if (opts.maxLength != null && !inputType.startsWith("delete")) {
    const currentLength = el.textContent?.length ?? 0;
    const dataLength = data?.length ?? 0;
    const sel = window.getSelection();
    let selectedLength = 0;
    if (sel && sel.rangeCount > 0 && el.contains(sel.anchorNode)) {
      selectedLength = sel.toString().length;
    }
    if (currentLength - selectedLength + dataLength > opts.maxLength) {
      return true;
    }
  }
  return false;
}

function wouldExceedThreshold(
  el: HTMLElement,
  data: string,
  limits: { maxHeight?: number; maxLines?: number; maxWidth?: number }
): boolean {
  const clone = el.cloneNode(true) as HTMLElement;
  clone.style.position = "fixed";
  clone.style.visibility = "hidden";
  clone.style.pointerEvents = "none";

  const cs = getComputedStyle(el);
  clone.style.width = cs.width;
  clone.textContent = (el.textContent ?? "") + data;
  document.body.appendChild(clone);

  let effectiveMaxHeight = limits.maxHeight;
  if (limits.maxLines != null) {
    let lineHeight = Number.parseFloat(cs.lineHeight);
    if (Number.isNaN(lineHeight)) {
      lineHeight = Number.parseFloat(cs.fontSize) * 1.2;
    }
    effectiveMaxHeight = lineHeight * limits.maxLines + 1;
  }

  const result = exceedsThreshold(
    { scrollHeight: clone.scrollHeight, scrollWidth: clone.scrollWidth },
    { maxHeight: effectiveMaxHeight, maxWidth: limits.maxWidth }
  );

  clone.remove();
  return result;
}

export function useFieldConstraints(
  ref: RefObject<HTMLElement | null>,
  options: UseFieldConstraintsOptions
) {
  const {
    active,
    maxHeight,
    maxLength,
    maxLines,
    maxWidth,
    multiline,
    numericOnly,
  } = options;
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

      if (
        el &&
        shouldPreventValueInput(el, e.data, e.inputType, {
          maxLength,
          numericOnly,
        })
      ) {
        e.preventDefault();
        return;
      }

      if (!hasThreshold || e.inputType.startsWith("delete") || !el || !e.data) {
        return;
      }

      if (wouldExceedThreshold(el, e.data, { maxHeight, maxLines, maxWidth })) {
        e.preventDefault();
      }
    },
    [
      ref,
      effectiveMultiline,
      maxLines,
      numericOnly,
      maxLength,
      hasThreshold,
      maxHeight,
      maxWidth,
    ]
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
