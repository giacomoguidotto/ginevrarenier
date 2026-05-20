"use client";

import { motion } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const SPRING = { type: "spring" as const, stiffness: 200, damping: 25 };

const STATE_COLORS = {
  info: "oklch(0.65 0.18 250)",
  warning: "oklch(0.82 0.17 80)",
  error: "oklch(0.65 0.2 25)",
} as const;

interface SemanticDotProps {
  action?: () => void;
  label: string;
  state: "info" | "warning" | "error";
}

export function SemanticDot({ state, label, action }: SemanticDotProps) {
  const dotStyle = {
    display: "inline-block",
    width: 8,
    height: 8,
    borderRadius: "50%",
    backgroundColor: STATE_COLORS[state],
  };

  const motionProps = {
    animate: { opacity: 1, scale: 1 },
    "data-slot": "semantic-dot",
    "data-variant": state,
    exit: { opacity: 0, scale: 0 },
    initial: { opacity: 0, scale: 0 },
    transition: SPRING,
  } as const;

  const dot = action ? (
    <motion.button
      {...motionProps}
      onClick={action}
      style={{ ...dotStyle, border: "none", padding: 0, cursor: "pointer" }}
      type="button"
    />
  ) : (
    <motion.span {...motionProps} style={dotStyle} />
  );

  return (
    <Tooltip>
      <TooltipTrigger asChild>{dot}</TooltipTrigger>
      <TooltipContent side="top" sideOffset={4}>
        {label}
      </TooltipContent>
    </Tooltip>
  );
}
