"use client";

import { useLocale } from "next-intl";
import type { RefObject } from "react";
import { useEffect, useRef } from "react";
import type { Locale } from "@/i18n/config";
import { useChromeRegister } from "./chrome-context";
import { useDraftBufferOps, useDraftBufferReset } from "./draft-buffer-context";
import { useEditMode } from "./edit-mode-context";
import { useSection } from "./section";
import { useFieldConstraints } from "./use-field-constraints";

type FieldElement = "h1" | "h2" | "h3" | "p" | "span" | "blockquote";

interface FieldProps {
  as?: FieldElement;
  className?: string;
  containerRef?: RefObject<HTMLElement | null>;
  maxHeight?: number;
  maxLines?: number;
  maxWidth?: number;
  multiline?: boolean;
  name: string;
  onChange?: (value: { en: string; it: string }) => void;
  value?: { en: string; it: string };
}

export function Field({
  name,
  as: Tag = "span",
  className,
  containerRef,
  maxHeight,
  maxLines,
  maxWidth,
  multiline,
  value: entityValue,
  onChange,
}: FieldProps) {
  const { name: section, data } = useSection();
  const { isEditMode, editingLocale } = useEditMode();
  const pageLocale = useLocale() as Locale;
  const locale = isEditMode ? editingLocale : pageLocale;
  const { read, write } = useDraftBufferOps();
  useDraftBufferReset();
  const elRef = useRef<HTMLElement>(null);
  useChromeRegister(name, containerRef ?? elRef);

  useEffect(() => {
    const container = containerRef?.current;
    if (!(isEditMode && container)) {
      return;
    }

    const onMouseDown = (e: MouseEvent) => {
      if (elRef.current && !elRef.current.contains(e.target as Node)) {
        e.preventDefault();
        elRef.current.focus();
      }
    };

    const onClick = (e: MouseEvent) => {
      e.preventDefault();
    };

    container.addEventListener("mousedown", onMouseDown);
    container.addEventListener("click", onClick);
    return () => {
      container.removeEventListener("mousedown", onMouseDown);
      container.removeEventListener("click", onClick);
    };
  }, [isEditMode, containerRef]);

  const entityMode = entityValue !== undefined;

  const { style: constraintStyle } = useFieldConstraints(elRef, {
    active: isEditMode,
    maxHeight,
    maxLines,
    maxWidth,
    multiline,
  });

  const prevLocaleRef = useRef(locale);

  useEffect(() => {
    if (prevLocaleRef.current !== locale && isEditMode && elRef.current) {
      const currentText = elRef.current.textContent ?? "";
      const oldLocale = prevLocaleRef.current;

      if (entityMode) {
        if (currentText !== entityValue[oldLocale as Locale]) {
          onChange?.({
            ...entityValue,
            [oldLocale]: currentText,
          });
        }
      } else {
        const oldConvexValue = data?.[name]?.[oldLocale] ?? "";
        if (currentText !== oldConvexValue) {
          write(section, name, oldLocale, currentText);
        }
      }
      prevLocaleRef.current = locale;
    }
  }, [
    locale,
    isEditMode,
    section,
    name,
    write,
    data,
    entityMode,
    entityValue,
    onChange,
  ]);

  let displayValue: string;
  if (entityMode) {
    displayValue = entityValue[locale] ?? "";
  } else {
    const draftValue = read(section, name, locale);
    const convexValue = data?.[name]?.[locale] ?? "";
    displayValue = draftValue ?? convexValue;
  }

  const sourceValue = entityMode
    ? (entityValue[locale] ?? "")
    : (data?.[name]?.[locale] ?? "");

  useEffect(() => {
    if (elRef.current && elRef.current.textContent !== displayValue) {
      elRef.current.textContent = displayValue;
    }
  }, [displayValue]);

  const handleInput = () => {
    const text = elRef.current?.textContent ?? "";
    if (entityMode) {
      if (text !== sourceValue) {
        onChange?.({ ...entityValue, [locale]: text });
      }
    } else if (text !== sourceValue) {
      write(section, name, locale, text);
    }
  };

  return (
    <Tag
      className={
        `${className ?? ""} ${isEditMode ? "editable-field" : ""}`.trim() ||
        undefined
      }
      contentEditable={isEditMode ? ("plaintext-only" as const) : undefined}
      onBlur={isEditMode ? handleInput : undefined}
      onClick={
        isEditMode ? (e: React.MouseEvent) => e.preventDefault() : undefined
      }
      onInput={isEditMode ? handleInput : undefined}
      ref={elRef as React.RefObject<never>}
      style={constraintStyle}
      suppressContentEditableWarning={isEditMode}
    />
  );
}
