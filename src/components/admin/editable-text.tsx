"use client";

import { useLocale } from "next-intl";
import { useEffect, useRef, useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Locale } from "@/i18n/config";
import { useEditMode } from "./edit-mode-context";

/**
 * Returns the active locale for display/editing.
 * In edit mode, uses the editing locale from toolbar.
 * Otherwise, uses the page locale from next-intl.
 */
function useActiveLocale(): Locale {
  const pageLocale = useLocale() as Locale;
  const { isEditMode, editingLocale } = useEditMode();
  return isEditMode ? editingLocale : pageLocale;
}

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
 * Shows an amber dot when the other locale is empty.
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
  const locale = useActiveLocale();
  const otherLocale: Locale = locale === "en" ? "it" : "en";
  const text = value?.[locale] ?? "";
  const otherText = value?.[otherLocale] ?? "";
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(text);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  // The other locale needs attention if current has content but the other is empty
  const otherNeedsAttention =
    isEditMode && text.length > 0 && otherText.length === 0;

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
  const staleIndicator = otherNeedsAttention ? (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-amber-400 align-middle" />
      </TooltipTrigger>
      <TooltipContent side="top" sideOffset={4}>
        Missing {otherLocale.toUpperCase()} translation
      </TooltipContent>
    </Tooltip>
  ) : null;

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
      {staleIndicator}
    </Tag>
  );
}
