"use client";

import { useLocale } from "next-intl";
import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { useEditMode } from "./edit-mode-context";

type EditableTextProps = {
  value: { en: string; it: string } | undefined;
  onChange: (value: { en: string; it: string }) => void;
  as?: "p" | "h1" | "h2" | "h3" | "span" | "blockquote";
  className?: string;
  multiline?: boolean;
  placeholder?: string;
};

/**
 * Text element that becomes editable when edit mode is active.
 * Shows the current locale's text and writes back to the bilingual field.
 */
export function EditableText({
  value,
  onChange,
  as: Tag = "span",
  className = "",
  multiline = false,
  placeholder = "Enter text...",
}: EditableTextProps) {
  const { isEditMode } = useEditMode();
  const locale = useLocale() as Locale;
  const text = value?.[locale] ?? "";
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(text);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  // Sync draft when value or locale changes externally
  useEffect(() => {
    if (!editing) {
      setDraft(value?.[locale] ?? "");
    }
  }, [value, locale, editing]);

  // Auto-focus when entering edit
  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editing]);

  if (!isEditMode) {
    return <Tag className={className}>{text || placeholder}</Tag>;
  }

  if (editing) {
    const handleBlur = () => {
      setEditing(false);
      if (draft !== text && value) {
        onChange({ ...value, [locale]: draft });
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        setDraft(text);
        setEditing(false);
      }
      if (e.key === "Enter" && !multiline) {
        handleBlur();
      }
    };

    const sharedProps = {
      ref: inputRef as never,
      value: draft,
      onChange: (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
      ) => setDraft(e.target.value),
      onBlur: handleBlur,
      onKeyDown: handleKeyDown,
      className: `${className} w-full bg-transparent outline-none ring-1 ring-foreground/20 rounded px-1 -mx-1 focus:ring-foreground/40`,
      placeholder,
    };

    if (multiline) {
      return <textarea rows={3} {...sharedProps} />;
    }

    return <input type="text" {...sharedProps} />;
  }

  // Edit mode but not actively editing — show text with edit affordance
  return (
    <Tag
      className={`${className} -mx-1 cursor-text rounded px-1 transition-colors hover:ring-1 hover:ring-foreground/20`}
      onClick={() => setEditing(true)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          setEditing(true);
        }
      }}
      role="button"
      tabIndex={0}
    >
      {text || <span className="text-foreground/30 italic">{placeholder}</span>}
    </Tag>
  );
}
