"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useEditMode } from "@/components/admin/edit-mode-context";
import { fadeUp } from "@/lib/animations";

export function ReflectionsEmptyState() {
  const { isEditMode } = useEditMode();
  const t = useTranslations("reflections");

  if (isEditMode) {
    return null;
  }

  return (
    <motion.div
      animate="visible"
      className="flex flex-col items-center justify-center py-24"
      initial="hidden"
      variants={fadeUp}
    >
      {/* Ink-drop / pen-stroke motif */}
      <svg
        aria-hidden="true"
        className="mb-8 h-24 w-24"
        fill="none"
        viewBox="0 0 96 96"
      >
        {/* Ink drop */}
        <path
          className="stroke-cream/20"
          d="M48 12 C48 12, 28 40, 28 56 C28 67 37 76 48 76 C59 76 68 67 68 56 C68 40 48 12 48 12Z"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1"
        />
        {/* Ripple rings */}
        <ellipse
          className="stroke-cream/20"
          cx="48"
          cy="72"
          rx="20"
          ry="4"
          strokeWidth="1"
        />
        <ellipse
          className="stroke-cream/20"
          cx="48"
          cy="72"
          rx="32"
          ry="6"
          strokeWidth="1"
        />
        {/* Pen stroke accent */}
        <path
          className="stroke-cream/20"
          d="M36 44 Q42 38 48 44 Q54 50 60 44"
          strokeLinecap="round"
          strokeWidth="1"
        />
      </svg>

      <h2 className="mb-2 font-light text-2xl text-foreground tracking-wide">
        {t("empty.title")}
      </h2>
      <p className="text-muted-foreground">{t("empty.subtitle")}</p>
    </motion.div>
  );
}
