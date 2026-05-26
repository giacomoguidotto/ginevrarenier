"use client";

import { useLocale } from "next-intl";
import type { RefObject } from "react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Locale } from "@/i18n/config";
import { locales } from "@/i18n/config";
import { useChromeEnabler } from "./chrome-enabler";
import {
  useDraftBufferOps,
  useDraftBufferReset,
  useEditVersion,
} from "./draft-buffer-context";
import { useEditMode } from "./edit-mode-context";
import { FieldChrome } from "./field-chrome";
import { useSection } from "./section";
import { useFieldConstraints } from "./use-field-constraints";

type FieldElement = "h1" | "h2" | "h3" | "p" | "span" | "blockquote";

interface FieldProps {
  as?: FieldElement;
  className?: string;
  containerRef?: RefObject<HTMLElement | null>;
  maxHeight?: number;
  maxLength?: number;
  maxLines?: number;
  maxWidth?: number;
  multiline?: boolean;
  name: string;
  numericOnly?: boolean;
  readOnly?: boolean;
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Field is a leaf component with many editing concerns
export function Field({
  name,
  as: Tag = "span",
  className,
  containerRef,
  maxHeight,
  maxLength,
  maxLines,
  maxWidth,
  multiline,
  numericOnly,
  readOnly,
}: FieldProps) {
  const { name: section, data } = useSection();
  const { isEditMode, editingLocale } = useEditMode();
  const pageLocale = useLocale() as Locale;
  const locale = isEditMode ? editingLocale : pageLocale;
  const { read, write, removeEdit, editedLocales, fieldStatus, dismiss } =
    useDraftBufferOps();
  useDraftBufferReset();
  useEditVersion();
  const { enabled } = useChromeEnabler();
  const elRef = useRef<HTMLElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [focused, setFocused] = useState(false);
  const [dims, setDims] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = containerRef?.current ?? wrapperRef.current;
    if (!el) {
      return;
    }
    const ro = new ResizeObserver(() => {
      setDims({ width: el.clientWidth, height: el.clientHeight });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [containerRef]);

  useEffect(() => {
    const container = containerRef?.current;
    if (!(isEditMode && container)) {
      return;
    }
    const prevPosition = container.style.position;
    const prevOverflow = container.style.overflow;
    container.style.position = "relative";
    container.style.overflow = "visible";
    return () => {
      container.style.position = prevPosition;
      container.style.overflow = prevOverflow;
    };
  }, [isEditMode, containerRef]);

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

  const { style: constraintStyle } = useFieldConstraints(elRef, {
    active: isEditMode,
    maxHeight,
    maxLength,
    maxLines,
    maxWidth,
    multiline,
    numericOnly,
  });

  const prevLocaleRef = useRef(locale);

  useEffect(() => {
    if (prevLocaleRef.current !== locale && isEditMode && elRef.current) {
      const currentText = elRef.current.textContent ?? "";
      const oldLocale = prevLocaleRef.current;
      const oldConvexValue = data?.[name]?.[oldLocale] ?? "";
      if (currentText !== oldConvexValue) {
        write(section, name, oldLocale, currentText);
      } else if (read(section, name, oldLocale) !== undefined) {
        removeEdit(section, name, oldLocale);
      }
      prevLocaleRef.current = locale;
    }
  }, [locale, isEditMode, section, name, write, read, removeEdit, data]);

  const draftValue = read(section, name, locale);
  const convexValue = data?.[name]?.[locale] ?? "";
  const displayValue = draftValue ?? convexValue;
  const sourceValue = convexValue;

  useEffect(() => {
    if (elRef.current && elRef.current.textContent !== displayValue) {
      elRef.current.textContent = displayValue;
    }
  }, [displayValue]);

  const handleInput = () => {
    const text = elRef.current?.textContent ?? "";
    if (text !== sourceValue) {
      write(section, name, locale, text);
    } else if (draftValue !== undefined) {
      removeEdit(section, name, locale);
    }
  };

  const handleFocus = () => setFocused(true);
  const handleBlur = () => {
    handleInput();
    setFocused(false);
  };

  const edited = editedLocales(section, name);
  let staleLocale: string | null = null;
  if (edited.size === 1) {
    const [editedLoc] = edited;
    const other = locales.find((l) => l !== editedLoc) ?? null;
    if (other === locale) {
      staleLocale = other;
    }
  }
  const status = staleLocale
    ? fieldStatus(section, name, staleLocale)
    : fieldStatus(section, name, locale);
  const handleDismiss =
    staleLocale && status === "stale"
      ? () => dismiss(section, name, staleLocale)
      : undefined;

  const editable = isEditMode && !readOnly;

  const showChrome = enabled && editable;
  const chrome = showChrome ? (
    <FieldChrome
      fieldStatus={status}
      focused={focused}
      height={dims.height}
      onDismiss={handleDismiss}
      staleLocale={staleLocale}
      width={dims.width}
    />
  ) : null;

  return (
    <div
      className={className}
      ref={wrapperRef}
      style={{ position: "relative" }}
    >
      <Tag
        className={editable ? "editable-field" : undefined}
        contentEditable={editable ? ("plaintext-only" as const) : undefined}
        onBlur={editable ? handleBlur : undefined}
        onClick={
          editable ? (e: React.MouseEvent) => e.preventDefault() : undefined
        }
        onFocus={editable ? handleFocus : undefined}
        onInput={editable ? handleInput : undefined}
        ref={elRef as React.RefObject<never>}
        style={
          editable
            ? { minHeight: "1lh", minWidth: "3ch", ...constraintStyle }
            : { minHeight: "1lh", ...constraintStyle }
        }
        suppressContentEditableWarning={editable}
      />
      {containerRef?.current
        ? createPortal(chrome, containerRef.current)
        : chrome}
    </div>
  );
}
