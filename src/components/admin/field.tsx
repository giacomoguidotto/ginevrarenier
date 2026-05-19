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
  maxLines?: number;
  maxWidth?: number;
  multiline?: boolean;
  name: string;
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
}: FieldProps) {
  const { name: section, data } = useSection();
  const { isEditMode, editingLocale } = useEditMode();
  const pageLocale = useLocale() as Locale;
  const locale = isEditMode ? editingLocale : pageLocale;
  const { read, write, editedLocales } = useDraftBufferOps();
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
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setDims({ width, height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [containerRef]);

  useEffect(() => {
    const container = containerRef?.current;
    if (!(isEditMode && container)) {
      return;
    }
    const prev = container.style.position;
    container.style.position = "relative";
    return () => {
      container.style.position = prev;
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
    maxLines,
    maxWidth,
    multiline,
  });

  const prevLocaleRef = useRef(locale);

  useEffect(() => {
    if (prevLocaleRef.current !== locale && isEditMode && elRef.current) {
      const currentText = elRef.current.textContent ?? "";
      const oldLocale = prevLocaleRef.current;
      const oldConvexValue = data?.[name]?.[oldLocale] ?? "";
      if (currentText !== oldConvexValue) {
        write(section, name, oldLocale, currentText);
      }
      prevLocaleRef.current = locale;
    }
  }, [locale, isEditMode, section, name, write, data]);

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
    staleLocale = locales.find((l) => l !== editedLoc) ?? null;
  }

  const showChrome = enabled && isEditMode;
  const chrome = showChrome ? (
    <FieldChrome
      focused={focused}
      height={dims.height}
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
        className={isEditMode ? "editable-field" : undefined}
        contentEditable={isEditMode ? ("plaintext-only" as const) : undefined}
        onBlur={isEditMode ? handleBlur : undefined}
        onClick={
          isEditMode ? (e: React.MouseEvent) => e.preventDefault() : undefined
        }
        onFocus={isEditMode ? handleFocus : undefined}
        onInput={isEditMode ? handleInput : undefined}
        ref={elRef as React.RefObject<never>}
        style={constraintStyle}
        suppressContentEditableWarning={isEditMode}
      />
      {containerRef?.current
        ? createPortal(chrome, containerRef.current)
        : chrome}
    </div>
  );
}
