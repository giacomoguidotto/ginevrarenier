"use client";

import { useEffect, useRef } from "react";
import {
  useDraftBufferOps,
  useDraftBufferReset,
  useEditVersion,
} from "./draft-buffer-context";
import { useEditMode } from "./edit-mode-context";

type PlainFieldElement = "h1" | "h2" | "h3" | "p" | "span" | "blockquote";

const FIXED_LOCALE = "en";

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

  const draftValue = read(section, name, FIXED_LOCALE);
  const displayValue = draftValue ?? sourceValue;

  useEffect(() => {
    if (elRef.current && elRef.current.textContent !== displayValue) {
      elRef.current.textContent = displayValue;
    }
  }, [displayValue]);

  const handleInput = () => {
    const text = elRef.current?.textContent ?? "";
    if (text !== sourceValue) {
      write(section, name, FIXED_LOCALE, text);
    } else if (draftValue !== undefined) {
      removeEdit(section, name, FIXED_LOCALE);
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
