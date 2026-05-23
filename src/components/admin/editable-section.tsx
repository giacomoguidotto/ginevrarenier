"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";
import { useEditMode } from "./edit-mode-context";

interface EditableSectionProps {
  children: ReactNode;
  className?: string;
  label: string;
}

export function EditableSection({
  children,
  label,
  className = "",
}: EditableSectionProps) {
  const { isEditMode } = useEditMode();

  return (
    <div className={`relative ${className}`}>
      <AnimatePresence>
        {isEditMode && (
          <motion.div
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            key="section-chrome"
            transition={{ duration: 0.2 }}
          >
            <div className="pointer-events-none absolute inset-0 z-40 rounded border border-foreground/15 border-dashed" />
            <div className="pointer-events-none absolute top-0 left-0 z-40">
              <span className="inline-block bg-foreground/5 px-2 py-0.5 font-mono text-[10px] text-foreground/40 uppercase tracking-widest backdrop-blur-sm">
                {label}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {children}
    </div>
  );
}
