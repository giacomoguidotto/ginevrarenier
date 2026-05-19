"use client";

import { motion } from "framer-motion";
import { useId } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const SPRING = { type: "spring" as const, stiffness: 200, damping: 25 };

interface FieldChromeProps {
  focused: boolean;
  height: number;
  staleLocale: string | null;
  width: number;
}

export function FieldChrome({
  focused,
  height,
  staleLocale,
  width,
}: FieldChromeProps) {
  const id = useId();
  const patternId = `chrome-hatching${id}`;
  const perimeter = 2 * (width + height);
  const r = 4;

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
          height={height}
          initial={{ strokeDashoffset: perimeter }}
          strokeDasharray={perimeter}
          strokeWidth={1}
          transition={SPRING}
          width={width}
          x={0}
          y={0}
        />

        <motion.rect
          animate={{ opacity: focused ? 0 : 1 }}
          exit={{ opacity: 0 }}
          fill={`url(#${patternId})`}
          height={height}
          initial={{ opacity: 0 }}
          transition={{ ...SPRING, delay: 0.1 }}
          width={width}
          x={0}
          y={0}
        />

        {staleLocale !== null && (
          <motion.circle
            animate={{ opacity: 1, scale: 1 }}
            cx={width - r - 2}
            cy={r + 2}
            exit={{ opacity: 0, scale: 0 }}
            fill="oklch(0.82 0.17 80)"
            initial={{ opacity: 0, scale: 0 }}
            r={r}
            transition={SPRING}
          />
        )}
      </svg>

      {staleLocale !== null && (
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              style={{
                position: "absolute",
                right: 2,
                top: 2,
                width: r * 2,
                height: r * 2,
                borderRadius: "50%",
              }}
            />
          </TooltipTrigger>
          <TooltipContent side="top" sideOffset={4}>
            {staleLocale.toUpperCase()} was not modified
          </TooltipContent>
        </Tooltip>
      )}
    </>
  );
}
