"use client";

import { useLocale } from "next-intl";
import { useEffect, useRef } from "react";
import type { Locale } from "@/i18n/config";
import { useDraftBufferOps, useDraftBufferReset } from "./draft-buffer-context";
import { useEditMode } from "./edit-mode-context";
import { useSection } from "./section";

type FieldElement = "h1" | "h2" | "h3" | "p" | "span" | "blockquote";

interface FieldProps {
  as?: FieldElement;
  className?: string;
  name: string;
}

export function Field({ name, as: Tag = "span", className }: FieldProps) {
  const { name: section, data } = useSection();
  const { isEditMode, editingLocale } = useEditMode();
  const pageLocale = useLocale() as Locale;
  const locale = isEditMode ? editingLocale : pageLocale;
  const { read, write } = useDraftBufferOps();
  useDraftBufferReset();
  const elRef = useRef<HTMLElement>(null);

  const draftValue = read(section, name, locale);
  const convexValue = data?.[name]?.[locale] ?? "";
  const displayValue = draftValue ?? convexValue;

  useEffect(() => {
    if (elRef.current && elRef.current.textContent !== displayValue) {
      elRef.current.textContent = displayValue;
    }
  }, [displayValue]);

  const handleInput = () => {
    const text = elRef.current?.textContent ?? "";
    if (text === convexValue) {
      return;
    }
    write(section, name, locale, text);
  };

  return (
    <Tag
      className={
        `${className ?? ""} ${isEditMode ? "editable-field" : ""}`.trim() ||
        undefined
      }
      contentEditable={isEditMode ? ("plaintext-only" as const) : undefined}
      onBlur={isEditMode ? handleInput : undefined}
      onInput={isEditMode ? handleInput : undefined}
      ref={elRef as React.RefObject<never>}
      suppressContentEditableWarning={isEditMode}
    />
  );
}
