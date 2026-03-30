"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useEditMode } from "./edit-mode-context";

interface FieldRect {
  bottom: number;
  left: number;
  right: number;
  top: number;
}

interface LineData {
  /** Sort key for stagger: distance from top-left origin */
  staggerKey: number;
  x1: number;
  x2: number;
  y1: number;
  y2: number;
}

const ENTER_DURATION = 400;
const EXIT_DURATION = 300;
const HATCH_SIZE = 20;
const HATCH_SPACING = 4;
const LINE_OPACITY = 0.1;
const HATCH_OPACITY = 0.05;

function computeLines(
  fields: FieldRect[],
  sections: FieldRect[],
  vw: number,
  vh: number
): LineData[] {
  const lines: LineData[] = [];

  // Section boundary horizontals (full width)
  for (const s of sections) {
    // Top edge
    lines.push({
      x1: 0,
      y1: s.top,
      x2: vw,
      y2: s.top,
      staggerKey: s.top,
    });
    // Bottom edge
    lines.push({
      x1: 0,
      y1: s.bottom,
      x2: vw,
      y2: s.bottom,
      staggerKey: s.bottom,
    });
  }

  // Field lines — horizontals and verticals, interrupted at field boundary
  for (const f of fields) {
    // Horizontal from top edge: left segment + right segment
    lines.push({
      x1: 0,
      y1: f.top,
      x2: f.left,
      y2: f.top,
      staggerKey: f.top + f.left * 0.001,
    });
    lines.push({
      x1: f.right,
      y1: f.top,
      x2: vw,
      y2: f.top,
      staggerKey: f.top + f.right * 0.001,
    });

    // Horizontal from bottom edge: left segment + right segment
    lines.push({
      x1: 0,
      y1: f.bottom,
      x2: f.left,
      y2: f.bottom,
      staggerKey: f.bottom + f.left * 0.001,
    });
    lines.push({
      x1: f.right,
      y1: f.bottom,
      x2: vw,
      y2: f.bottom,
      staggerKey: f.bottom + f.right * 0.001,
    });

    // Vertical from left edge: top segment + bottom segment
    lines.push({
      x1: f.left,
      y1: 0,
      x2: f.left,
      y2: f.top,
      staggerKey: f.left + f.top * 0.001,
    });
    lines.push({
      x1: f.left,
      y1: f.bottom,
      x2: f.left,
      y2: vh,
      staggerKey: f.left + f.bottom * 0.001,
    });

    // Vertical from right edge: top segment + bottom segment
    lines.push({
      x1: f.right,
      y1: 0,
      x2: f.right,
      y2: f.top,
      staggerKey: f.right + f.top * 0.001,
    });
    lines.push({
      x1: f.right,
      y1: f.bottom,
      x2: f.right,
      y2: vh,
      staggerKey: f.right + f.bottom * 0.001,
    });
  }

  return lines;
}

function lineLength(l: LineData): number {
  const dx = l.x2 - l.x1;
  const dy = l.y2 - l.y1;
  return Math.sqrt(dx * dx + dy * dy);
}

export function EditModeLines() {
  const { isEditMode } = useEditMode();
  const [visible, setVisible] = useState(false);
  const [lines, setLines] = useState<LineData[]>([]);
  const [phase, setPhase] = useState<
    "entering" | "visible" | "exiting" | "hidden"
  >("hidden");
  const svgRef = useRef<SVGSVGElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

  const scanElements = useCallback(() => {
    const scrollY = window.scrollY;
    const vw = window.innerWidth;
    // Use full document height for lines that extend vertically
    const vh = document.documentElement.scrollHeight;

    const fieldEls = document.querySelectorAll(".editable-field");
    const fields: FieldRect[] = [];
    for (const el of fieldEls) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) {
        continue;
      }
      fields.push({
        top: r.top + scrollY,
        bottom: r.bottom + scrollY,
        left: r.left,
        right: r.right,
      });
    }

    const sectionEls = document.querySelectorAll("section");
    const sections: FieldRect[] = [];
    for (const el of sectionEls) {
      const r = el.getBoundingClientRect();
      sections.push({
        top: r.top + scrollY,
        bottom: r.bottom + scrollY,
        left: r.left,
        right: r.right,
      });
    }

    setLines(computeLines(fields, sections, vw, vh));
  }, []);

  // Toggle visibility with animation phases
  useEffect(() => {
    if (isEditMode) {
      setVisible(true);
      scanElements();
      // Small delay to ensure DOM is ready
      requestAnimationFrame(() => {
        setPhase("entering");
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
        timerRef.current = setTimeout(
          () => setPhase("visible"),
          ENTER_DURATION
        );
      });
    } else if (visible) {
      setPhase("exiting");
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        setPhase("hidden");
        setVisible(false);
      }, EXIT_DURATION);
    }
  }, [isEditMode, visible, scanElements]);

  // Update lines on scroll/resize
  useEffect(() => {
    if (!visible) {
      return;
    }

    const update = () => {
      requestAnimationFrame(scanElements);
    };

    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);

    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [visible, scanElements]);

  // Also toggle body class for any remaining CSS hooks
  useEffect(() => {
    if (isEditMode) {
      document.body.classList.add("edit-mode");
    } else {
      document.body.classList.remove("edit-mode");
    }
    return () => {
      document.body.classList.remove("edit-mode");
    };
  }, [isEditMode]);

  if (!visible) {
    return null;
  }

  const scrollY = typeof window === "undefined" ? 0 : window.scrollY;
  const vw = typeof window === "undefined" ? 0 : window.innerWidth;
  const _docHeight =
    typeof document === "undefined" ? 0 : document.documentElement.scrollHeight;

  // Sort lines by stagger key and assign delays
  const sorted = [...lines].sort((a, b) => a.staggerKey - b.staggerKey);
  const maxStagger = sorted.length > 0 ? (sorted.at(-1)?.staggerKey ?? 1) : 1;
  const isEntering = phase === "entering";
  const isExiting = phase === "exiting";
  const animating = isEntering || isExiting;
  const duration = isEntering ? ENTER_DURATION : EXIT_DURATION;
  // Reserve 60% of budget for stagger, 40% for each line's draw
  const staggerBudget = duration * 0.6;
  const lineDuration = duration * 0.4;

  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-40"
      ref={svgRef}
      style={{
        width: "100vw",
        height: "100vh",
        overflow: "visible",
      }}
    >
      {/* Hatching — left edge */}
      <g
        style={{
          opacity: phase === "visible" || phase === "entering" ? 1 : 0,
          transition: `opacity ${isExiting ? EXIT_DURATION : ENTER_DURATION}ms ease`,
        }}
      >
        <defs>
          <pattern
            height={HATCH_SPACING}
            id="hatch"
            patternTransform="rotate(45)"
            patternUnits="userSpaceOnUse"
            width={HATCH_SPACING}
          >
            <line
              stroke="currentColor"
              strokeWidth="0.5"
              x1="0"
              x2="0"
              y1="0"
              y2={HATCH_SPACING}
            />
          </pattern>
        </defs>
        <rect
          fill="url(#hatch)"
          height="100vh"
          style={{
            color: `oklch(from var(--foreground) l c h / ${HATCH_OPACITY})`,
          }}
          width={HATCH_SIZE}
          x="0"
          y="0"
        />
        <rect
          fill="url(#hatch)"
          height="100vh"
          style={{
            color: `oklch(from var(--foreground) l c h / ${HATCH_OPACITY})`,
          }}
          width={HATCH_SIZE}
          x={vw - HATCH_SIZE}
          y="0"
        />
      </g>

      {/* Lines */}
      <g
        style={{
          transform: `translateY(${-scrollY}px)`,
        }}
      >
        {sorted.map((line) => {
          const len = lineLength(line);
          if (len < 1) {
            return null;
          }

          const normalizedPos =
            maxStagger > 0 ? line.staggerKey / maxStagger : 0;
          const delay = normalizedPos * staggerBudget;

          const dashStyle = animating
            ? {
                strokeDasharray: len,
                strokeDashoffset: isEntering ? 0 : len,
                transition: `stroke-dashoffset ${lineDuration}ms ease-out ${delay}ms`,
              }
            : {};

          const initialOffset =
            isEntering && phase === "entering" ? { strokeDashoffset: len } : {};

          return (
            <line
              key={`${line.x1}-${line.y1}-${line.x2}-${line.y2}`}
              stroke="currentColor"
              strokeWidth="1"
              style={{
                color: `oklch(from var(--foreground) l c h / ${LINE_OPACITY})`,
                ...initialOffset,
                ...dashStyle,
              }}
              x1={line.x1}
              x2={line.x2}
              y1={line.y1}
              y2={line.y2}
            />
          );
        })}
      </g>
    </svg>
  );
}
