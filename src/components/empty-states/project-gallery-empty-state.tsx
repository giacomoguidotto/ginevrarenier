"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useEditMode } from "@/components/admin/edit-mode-context";
import { fadeUp } from "@/lib/animations";

export function ProjectGalleryEmptyState() {
  const { isEditMode } = useEditMode();
  const t = useTranslations("projectGallery");

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
      {/* Viewfinder brackets */}
      <svg
        aria-hidden="true"
        className="mb-8 h-32 w-32"
        fill="none"
        viewBox="0 0 96 96"
      >
        {/* Corner brackets */}
        <path
          className="stroke-cream/20"
          d="M18 34 L18 18 L34 18"
          strokeLinecap="round"
          strokeWidth="1"
        />
        <path
          className="stroke-cream/20"
          d="M62 18 L78 18 L78 34"
          strokeLinecap="round"
          strokeWidth="1"
        />
        <path
          className="stroke-cream/20"
          d="M78 62 L78 78 L62 78"
          strokeLinecap="round"
          strokeWidth="1"
        />
        <path
          className="stroke-cream/20"
          d="M34 78 L18 78 L18 62"
          strokeLinecap="round"
          strokeWidth="1"
        />
        {/* Center crosshair */}
        <line
          className="stroke-cream/20"
          strokeLinecap="round"
          strokeWidth="0.75"
          x1="45"
          x2="51"
          y1="48"
          y2="48"
        />
        <line
          className="stroke-cream/20"
          strokeLinecap="round"
          strokeWidth="0.75"
          x1="48"
          x2="48"
          y1="45"
          y2="51"
        />
      </svg>

      <h2 className="mb-2 font-light text-2xl text-foreground tracking-wide">
        {t("empty.title")}
      </h2>
      <p className="text-muted-foreground">{t("empty.subtitle")}</p>
    </motion.div>
  );
}
