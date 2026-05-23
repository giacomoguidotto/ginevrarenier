"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";
import { easeOutExpo } from "@/lib/animations";

export function CollapsibleSection({
  visible,
  children,
}: {
  visible: boolean;
  children: ReactNode;
}) {
  return (
    <AnimatePresence initial={false}>
      {visible && (
        <motion.div
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          initial={{ height: 0, opacity: 0 }}
          key="collapsible"
          style={{ overflow: "hidden" }}
          transition={{ duration: 0.35, ease: easeOutExpo }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
