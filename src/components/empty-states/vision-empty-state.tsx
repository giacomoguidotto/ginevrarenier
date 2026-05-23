"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useEditMode } from "@/components/admin/edit-mode-context";
import { fadeUp } from "@/lib/animations";

export function VisionEmptyState() {
  const { isEditMode } = useEditMode();
  const t = useTranslations("vision");

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
      {/* Aperture / lens diagram */}
      <svg
        aria-hidden="true"
        className="mb-8 h-24 w-24 animate-[spin_20s_linear_infinite]"
        fill="none"
        viewBox="0 0 96 96"
      >
        <circle
          className="stroke-foreground/20"
          cx="48"
          cy="48"
          r="44"
          strokeWidth="1"
        />
        <circle
          className="stroke-foreground/20"
          cx="48"
          cy="48"
          r="30"
          strokeWidth="1"
        />
        <circle
          className="stroke-foreground/20"
          cx="48"
          cy="48"
          r="16"
          strokeWidth="1"
        />
        {/* Aperture blades */}
        {[0, 60, 120, 180, 240, 300].map((angle) => (
          <line
            className="stroke-foreground/20"
            key={angle}
            strokeWidth="1"
            x1={48 + 16 * Math.cos((angle * Math.PI) / 180)}
            x2={48 + 44 * Math.cos(((angle + 30) * Math.PI) / 180)}
            y1={48 + 16 * Math.sin((angle * Math.PI) / 180)}
            y2={48 + 44 * Math.sin(((angle + 30) * Math.PI) / 180)}
          />
        ))}
      </svg>

      <h2 className="mb-2 font-light text-2xl text-foreground tracking-wide">
        {t("empty.title")}
      </h2>
      <p className="text-muted-foreground">{t("empty.subtitle")}</p>
    </motion.div>
  );
}
