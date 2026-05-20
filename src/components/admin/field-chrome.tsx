"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { useId } from "react";
import { SemanticDot } from "@/components/ui/semantic-dot";
import type { FieldStatus } from "./staleness-engine";

const SPRING = { type: "spring" as const, stiffness: 200, damping: 25 };

interface FieldChromeProps {
  fieldStatus: FieldStatus;
  focused: boolean;
  height: number;
  onDismiss?: () => void;
  staleLocale: string | null;
  width: number;
}

export function FieldChrome({
  fieldStatus,
  focused,
  height,
  onDismiss,
  staleLocale,
  width,
}: FieldChromeProps) {
  const id = useId();
  const patternId = `chrome-hatching${id}`;
  const inset = 0.5;
  const rectW = Math.max(0, width - 2 * inset);
  const rectH = Math.max(0, height - 2 * inset);
  const perimeter = 2 * (rectW + rectH);

  let dot: ReactNode = null;
  if (fieldStatus === "stale" && staleLocale !== null) {
    dot = (
      <SemanticDot
        action={onDismiss}
        label={`${staleLocale.toUpperCase()} was not modified`}
        state="warning"
      />
    );
  } else if (fieldStatus === "system-filled") {
    dot = <SemanticDot label="Auto-translated" state="info" />;
  }

  return (
    <>
      <svg
        aria-hidden="true"
        data-field-chrome
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
      >
        <defs>
          <pattern
            height="4"
            id={patternId}
            patternTransform="rotate(45)"
            patternUnits="userSpaceOnUse"
            width="4"
          >
            <line
              stroke="oklch(from var(--foreground) l c h / 0.10)"
              strokeWidth="1"
              x1="0"
              x2="0"
              y1="0"
              y2="4"
            />
          </pattern>
        </defs>

        <motion.rect
          animate={{
            strokeDashoffset: 0,
            stroke: focused
              ? "oklch(from var(--foreground) l c h / 0.50)"
              : "oklch(from var(--foreground) l c h / 0.25)",
          }}
          exit={{ strokeDashoffset: perimeter }}
          fill="none"
          height={rectH}
          initial={{ strokeDashoffset: perimeter }}
          strokeDasharray={perimeter}
          strokeWidth={1}
          transition={SPRING}
          width={rectW}
          x={inset}
          y={inset}
        />

        <motion.rect
          animate={{ opacity: focused ? 0 : 1 }}
          exit={{ opacity: 0 }}
          fill={`url(#${patternId})`}
          height={rectH}
          initial={{ opacity: 0 }}
          transition={{ ...SPRING, delay: 0.1 }}
          width={rectW}
          x={inset}
          y={inset}
        />
      </svg>

      {dot !== null && (
        <div
          style={{
            position: "absolute",
            right: 2,
            top: 2,
            pointerEvents: "auto",
          }}
        >
          {dot}
        </div>
      )}
    </>
  );
}
