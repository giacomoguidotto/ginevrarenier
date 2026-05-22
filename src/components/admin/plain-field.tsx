"use client";

import { useEffect, useRef } from "react";
import { locales } from "@/i18n/config";
import {
  useDraftBufferOps,
  useDraftBufferReset,
  useEditVersion,
} from "./draft-buffer-context";
import { useEditMode } from "./edit-mode-context";

type PlainFieldElement = "h1" | "h2" | "h3" | "p" | "span" | "blockquote";

interface PlainFieldProps {
  as?: PlainFieldElement;
  className?: string;
  name: string;
  section: string;
  sourceValue: string;
}

export function PlainField({
  name,
  section,
  sourceValue,
  as: Tag = "span",
  className,
}: PlainFieldProps) {
  const { isEditMode } = useEditMode();
  const { read, write, removeEdit } = useDraftBufferOps();
  useDraftBufferReset();
  useEditVersion();
  const elRef = useRef<HTMLElement>(null);

  const draftValue = read(section, name, locales[0]);
  const displayValue = draftValue ?? sourceValue;

  useEffect(() => {
    if (elRef.current && elRef.current.textContent !== displayValue) {
      elRef.current.textContent = displayValue;
    }
  }, [displayValue]);

  const handleInput = () => {
    const text = elRef.current?.textContent ?? "";
    if (text !== sourceValue) {
      for (const l of locales) {
        write(section, name, l, text);
      }
    } else if (draftValue !== undefined) {
      for (const l of locales) {
        removeEdit(section, name, l);
      }
    }
  };

  const handleBlur = () => {
    handleInput();
  };

  return (
    <Tag
      className={className}
      contentEditable={isEditMode ? ("plaintext-only" as const) : undefined}
      onBlur={isEditMode ? handleBlur : undefined}
      onInput={isEditMode ? handleInput : undefined}
      ref={elRef as React.RefObject<never>}
      suppressContentEditableWarning={isEditMode}
    />
  );
}
