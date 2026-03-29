"use client";

import type { ReactNode } from "react";
import { useEditMode } from "./edit-mode-context";

interface EditableSectionProps {
  children: ReactNode;
  className?: string;
  label: string;
}

/**
 * Wraps a page section with blueprint-style dashed outline and
 * corner label when edit mode is active.
 */
export function EditableSection({
  children,
  label,
  className = "",
}: EditableSectionProps) {
  const { isEditMode } = useEditMode();

  if (!isEditMode) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={`relative ${className}`}>
      {/* Dashed outline */}
      <div className="pointer-events-none absolute inset-0 z-40 rounded border border-foreground/15 border-dashed" />

      {/* Corner label */}
      <div className="pointer-events-none absolute top-0 left-0 z-40">
        <span className="inline-block bg-foreground/5 px-2 py-0.5 font-mono text-[10px] text-foreground/40 uppercase tracking-widest backdrop-blur-sm">
          {label}
        </span>
      </div>

      {children}
    </div>
  );
}
