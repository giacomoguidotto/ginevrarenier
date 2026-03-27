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
import { usePageChanges } from "./page-changes-context";

function useActiveLocale(): Locale {
  const pageLocale = useLocale() as Locale;
  const { isEditMode, editingLocale } = useEditMode();
  return isEditMode ? editingLocale : pageLocale;
}

function StaleIndicator({ locale }: { locale: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-amber-400 align-middle" />
      </TooltipTrigger>
      <TooltipContent side="top" sideOffset={4}>
        Missing {locale.toUpperCase()} translation
      </TooltipContent>
    </Tooltip>
  );
}

function EditInput({
  draft,
  setDraft,
  onCommit,
  onCancel,
  multiline,
  className,
  placeholder,
}: {
  draft: string;
  setDraft: (v: string) => void;
  onCommit: () => void;
  onCancel: () => void;
  multiline: boolean;
  className: string;
  placeholder: string;
}) {
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onCancel();
    }
    if (e.key === "Enter" && !multiline) {
      onCommit();
    }
  };

  const sharedProps = {
    ref: inputRef as never,
    value: draft,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setDraft(e.target.value),
    onBlur: onCommit,
    onKeyDown: handleKeyDown,
    className: `${className} w-full bg-transparent outline-none ring-1 ring-foreground/20 rounded px-1 -mx-1 focus:ring-foreground/40`,
    placeholder,
  };

  if (multiline) {
    return <textarea rows={3} {...sharedProps} />;
  }
  return <input type="text" {...sharedProps} />;
}

type EditableTextProps = {
  value: { en: string; it: string } | undefined;
  onChange: (value: { en: string; it: string }) => void;
  as?: "p" | "h1" | "h2" | "h3" | "span" | "blockquote";
  className?: string;
  multiline?: boolean;
  placeholder?: string;
};

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

  const { editedLocales, hasChanges } = usePageChanges();
  const otherWasEdited = hasChanges && editedLocales.has(otherLocale);
  const currentWasEdited = hasChanges && editedLocales.has(locale);
  const otherNeedsAttention =
    isEditMode &&
    ((otherWasEdited && !currentWasEdited) ||
      (text.length > 0 && otherText.length === 0));

  useEffect(() => {
    if (!editing) {
      setDraft(value?.[locale] ?? "");
    }
  }, [value, locale, editing]);

  if (!isEditMode) {
    return <Tag className={className}>{text || placeholder}</Tag>;
  }

  if (editing) {
    return (
      <EditInput
        className={className}
        draft={draft}
        multiline={multiline}
        onCancel={() => {
          setDraft(text);
          setEditing(false);
        }}
        onCommit={() => {
          setEditing(false);
          if (draft !== text && value) {
            onChange({ ...value, [locale]: draft });
          }
        }}
        placeholder={placeholder}
        setDraft={setDraft}
      />
    );
  }

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
      {otherNeedsAttention ? <StaleIndicator locale={otherLocale} /> : null}
    </Tag>
  );
}
