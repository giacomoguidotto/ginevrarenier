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

/**
 * Find the section that contains a field (by vertical overlap).
 */
function findParentSection(
  field: FieldRect,
  sections: FieldRect[]
): FieldRect | null {
  for (const s of sections) {
    if (field.top >= s.top && field.bottom <= s.bottom) {
      return s;
    }
  }
  return null;
}

function computeLines(
  fields: FieldRect[],
  sections: FieldRect[],
  vw: number,
  scrollTop: number,
  scrollBottom: number
): LineData[] {
  const lines: LineData[] = [];

  // Section boundary horizontals — only for visible sections
  for (const s of sections) {
    if (s.bottom < scrollTop || s.top > scrollBottom) {
      continue;
    }
    lines.push({
      x1: 0,
      y1: s.top,
      x2: vw,
      y2: s.top,
      staggerKey: s.top,
    });
    lines.push({
      x1: 0,
      y1: s.bottom,
      x2: vw,
      y2: s.bottom,
      staggerKey: s.bottom,
    });
  }

  // Field lines — only for fields visible in viewport
  for (const f of fields) {
    if (f.bottom < scrollTop || f.top > scrollBottom) {
      continue;
    }

    const section = findParentSection(f, sections);
    const vTop = section ? section.top : scrollTop;
    const vBottom = section ? section.bottom : scrollBottom;

    // Horizontal from top edge: left + right segments
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

    // Horizontal from bottom edge: left + right segments
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

    // Vertical from left edge: top segment (to section top) + bottom segment (to section bottom)
    lines.push({
      x1: f.left,
      y1: vTop,
      x2: f.left,
      y2: f.top,
      staggerKey: f.left * 0.1 + f.top * 0.001,
    });
    lines.push({
      x1: f.left,
      y1: f.bottom,
      x2: f.left,
      y2: vBottom,
      staggerKey: f.left * 0.1 + f.bottom * 0.001,
    });

    // Vertical from right edge: top segment + bottom segment
    lines.push({
      x1: f.right,
      y1: vTop,
      x2: f.right,
      y2: f.top,
      staggerKey: f.right * 0.1 + f.top * 0.001,
    });
    lines.push({
      x1: f.right,
      y1: f.bottom,
      x2: f.right,
      y2: vBottom,
      staggerKey: f.right * 0.1 + f.bottom * 0.001,
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
  const animFrameRef = useRef(0);

  const scanElements = useCallback(() => {
    const scrollY = window.scrollY;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const scrollTop = scrollY;
    const scrollBottom = scrollY + vh;

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

    setLines(computeLines(fields, sections, vw, scrollTop, scrollBottom));
  }, []);

  // Toggle visibility with animation phases
  useEffect(() => {
    if (isEditMode) {
      setVisible(true);
      scanElements();
      // Use double rAF to ensure the initial dashoffset renders before transition
      animFrameRef.current = requestAnimationFrame(() => {
        animFrameRef.current = requestAnimationFrame(() => {
          setPhase("entering");
          if (timerRef.current) {
            clearTimeout(timerRef.current);
          }
          timerRef.current = setTimeout(
            () => setPhase("visible"),
            ENTER_DURATION
          );
        });
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

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
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

  // Body class for any remaining CSS hooks
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

  // Deduplicate and sort
  const seen = new Set<string>();
  const sorted = [...lines]
    .sort((a, b) => a.staggerKey - b.staggerKey)
    .filter((l) => {
      const k = `${Math.round(l.x1)},${Math.round(l.y1)},${Math.round(l.x2)},${Math.round(l.y2)}`;
      if (seen.has(k)) {
        return false;
      }
      seen.add(k);
      return true;
    });

  const maxStagger = sorted.length > 0 ? (sorted.at(-1)?.staggerKey ?? 1) : 1;
  const isEntering = phase === "entering";
  const isExiting = phase === "exiting";
  const duration = isEntering ? ENTER_DURATION : EXIT_DURATION;
  const staggerBudget = duration * 0.6;
  const lineDuration = duration * 0.4;

  // Before entering phase: lines should be at full dashoffset (invisible)
  // During entering: transition to 0 (visible)
  // During exiting: transition to full dashoffset (invisible)
  const preEnter =
    phase === "hidden" ||
    (visible && !isEntering && !isExiting && phase !== "visible");

  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-40"
      ref={svgRef}
      style={{ width: "100vw", height: "100vh", overflow: "visible" }}
    >
      {/* Hatching */}
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
          height="100%"
          style={{
            color: `oklch(from var(--foreground) l c h / ${HATCH_OPACITY})`,
          }}
          width={HATCH_SIZE}
          x="0"
          y="0"
        />
        <rect
          fill="url(#hatch)"
          height="100%"
          style={{
            color: `oklch(from var(--foreground) l c h / ${HATCH_OPACITY})`,
          }}
          width={HATCH_SIZE}
          x={vw - HATCH_SIZE}
          y="0"
        />
      </g>

      {/* Lines */}
      <g style={{ transform: `translateY(${-scrollY}px)` }}>
        {sorted.map((line) => {
          const len = lineLength(line);
          if (len < 1) {
            return null;
          }

          const normalizedPos =
            maxStagger > 0 ? line.staggerKey / maxStagger : 0;
          const delay = normalizedPos * staggerBudget;

          let strokeDashoffset: number;
          let transition: string;

          if (preEnter) {
            // Initial state: fully hidden
            strokeDashoffset = len;
            transition = "none";
          } else if (isEntering) {
            // Animate to visible
            strokeDashoffset = 0;
            transition = `stroke-dashoffset ${lineDuration}ms ease-out ${delay}ms`;
          } else if (isExiting) {
            // Animate to hidden
            strokeDashoffset = len;
            transition = `stroke-dashoffset ${lineDuration}ms ease-in ${delay}ms`;
          } else {
            // Fully visible
            strokeDashoffset = 0;
            transition = "none";
          }

          return (
            <line
              key={`${Math.round(line.x1)}-${Math.round(line.y1)}-${Math.round(line.x2)}-${Math.round(line.y2)}-${line.staggerKey}`}
              stroke="currentColor"
              strokeWidth="1"
              style={{
                color: `oklch(from var(--foreground) l c h / ${LINE_OPACITY})`,
                strokeDasharray: len,
                strokeDashoffset,
                transition,
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
