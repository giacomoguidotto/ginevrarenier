"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { pageTransition } from "@/lib/animations";

type PageTransitionProps = {
  children: ReactNode;
  className?: string;
};

export function PageTransition({ children, className }: PageTransitionProps) {
  return (
    <motion.div
      animate="animate"
      className={className}
      exit="exit"
      initial="initial"
      variants={pageTransition}
    >
      {children}
    </motion.div>
  );
}
