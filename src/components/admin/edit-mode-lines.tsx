"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useEditMode } from "./edit-mode-context";

const LINE_COLOR = "oklch(from var(--foreground) l c h / 0.1)";
const LINE_STRONG = "oklch(from var(--foreground) l c h / 0.15)";
const HATCH_COLOR = "oklch(from var(--foreground) l c h / 0.1)";
const ANIM_DURATION = 400;

/**
 * Creates a horizontal line div (full width of parent, 1px tall, absolute).
 */
function createHLine(
  topPx: number,
  color: string,
  delay: number
): HTMLDivElement {
  const el = document.createElement("div");
  el.className = "arch-line";
  el.style.cssText = `
    position: absolute;
    left: 0;
    right: 0;
    top: ${topPx}px;
    height: 0;
    border-top: 1px solid ${color};
    pointer-events: none;
    z-index: 1;
    transform-origin: left;
    transform: scaleX(0);
    transition: transform ${ANIM_DURATION * 0.4}ms ease-out ${delay}ms;
  `;
  // Trigger animation
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      el.style.transform = "scaleX(1)";
    });
  });
  return el;
}

/**
 * Creates a vertical line div (full height of parent, 1px wide, absolute).
 */
function createVLine(
  leftPx: number,
  color: string,
  delay: number
): HTMLDivElement {
  const el = document.createElement("div");
  el.className = "arch-line";
  el.style.cssText = `
    position: absolute;
    top: 0;
    bottom: 0;
    left: ${leftPx}px;
    width: 0;
    border-left: 1px solid ${color};
    pointer-events: none;
    z-index: 1;
    transform-origin: top;
    transform: scaleY(0);
    transition: transform ${ANIM_DURATION * 0.4}ms ease-out ${delay}ms;
  `;
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      el.style.transform = "scaleY(1)";
    });
  });
  return el;
}

/**
 * Creates the hatching strips on viewport left/right edges (fixed).
 */
function createHatching(): HTMLDivElement[] {
  const strips: HTMLDivElement[] = [];
  for (const side of ["left", "right"] as const) {
    const el = document.createElement("div");
    el.className = "arch-hatch";
    el.style.cssText = `
      position: fixed;
      top: 0;
      ${side}: 0;
      width: 20px;
      height: 100vh;
      pointer-events: none;
      z-index: 41;
      background-color: var(--background);
      background-image: repeating-linear-gradient(
        45deg,
        ${HATCH_COLOR} 0px,
        ${HATCH_COLOR} 1px,
        transparent 1px,
        transparent 4px
      );
      opacity: 0;
      transition: opacity ${ANIM_DURATION}ms ease;
    `;
    requestAnimationFrame(() => {
      el.style.opacity = "1";
    });
    strips.push(el);
  }
  return strips;
}

function injectLines() {
  const sections = document.querySelectorAll("section");
  const allLines: HTMLElement[] = [];
  const docHeight = document.documentElement.scrollHeight;
  const vw = window.innerWidth;
  const staggerMax = ANIM_DURATION * 0.6;

  for (const section of sections) {
    // Ensure section is positioned for absolute children
    const computed = getComputedStyle(section);
    if (computed.position === "static") {
      section.style.position = "relative";
      section.setAttribute("data-arch-positioned", "true");
    }

    const sectionRect = section.getBoundingClientRect();
    const sectionH = section.scrollHeight;
    const sectionAbsTop = sectionRect.top + window.scrollY;

    // Delay based on Y position (top-to-bottom)
    const yDelay = (y: number) =>
      ((sectionAbsTop + y) / docHeight) * staggerMax;
    // Delay based on X position (left-to-right)
    const xDelay = (x: number) => (x / vw) * staggerMax;

    // Section top/bottom boundary lines
    const topLine = createHLine(0, LINE_STRONG, yDelay(0));
    const botLine = createHLine(sectionH, LINE_STRONG, yDelay(sectionH));
    section.appendChild(topLine);
    section.appendChild(botLine);
    allLines.push(topLine, botLine);

    // Hatching separator at section bottom boundary
    const hatchSep = document.createElement("div");
    hatchSep.className = "arch-line";
    hatchSep.style.cssText = `
      position: absolute;
      left: 0;
      right: 0;
      bottom: -8px;
      height: 16px;
      pointer-events: none;
      z-index: 2;
      background-color: var(--background);
      background-image: repeating-linear-gradient(
        45deg,
        ${LINE_COLOR} 0px,
        ${LINE_COLOR} 1px,
        transparent 1px,
        transparent 4px
      );
      opacity: 0;
      transition: opacity ${ANIM_DURATION}ms ease;
    `;
    requestAnimationFrame(() => {
      hatchSep.style.opacity = "1";
    });
    section.appendChild(hatchSep);
    allLines.push(hatchSep);

    // Find editable fields — skip those inside a button/link (handled separately)
    const fields = section.querySelectorAll(".editable-field");
    for (const field of fields) {
      if (field.closest("a") || field.closest("button")) {
        continue;
      }
      const fieldRect = field.getBoundingClientRect();
      const relTop = fieldRect.top - sectionRect.top + section.scrollTop;
      const relBottom = relTop + fieldRect.height;
      const relLeft = fieldRect.left - sectionRect.left;
      const relRight = relLeft + fieldRect.width;

      // Horizontal lines — delay by Y position
      allLines.push(
        section.appendChild(createHLine(relTop, LINE_COLOR, yDelay(relTop)))
      );
      allLines.push(
        section.appendChild(
          createHLine(relBottom, LINE_COLOR, yDelay(relBottom))
        )
      );

      // Vertical lines — delay by X position
      allLines.push(
        section.appendChild(createVLine(relLeft, LINE_COLOR, xDelay(relLeft)))
      );
      allLines.push(
        section.appendChild(createVLine(relRight, LINE_COLOR, xDelay(relRight)))
      );
    }

    // Also find buttons/links with editable-field children and draw from the button edges
    const buttons = section.querySelectorAll(
      "a:has(.editable-field), button:has(.editable-field)"
    );
    for (const btn of buttons) {
      const btnRect = btn.getBoundingClientRect();
      const relTop = btnRect.top - sectionRect.top + section.scrollTop;
      const relBottom = relTop + btnRect.height;
      const relLeft = btnRect.left - sectionRect.left;
      const relRight = relLeft + btnRect.width;

      allLines.push(
        section.appendChild(createHLine(relTop, LINE_COLOR, yDelay(relTop)))
      );
      allLines.push(
        section.appendChild(
          createHLine(relBottom, LINE_COLOR, yDelay(relBottom))
        )
      );
      allLines.push(
        section.appendChild(createVLine(relLeft, LINE_COLOR, xDelay(relLeft)))
      );
      allLines.push(
        section.appendChild(createVLine(relRight, LINE_COLOR, xDelay(relRight)))
      );
    }
  }

  // Hatching on viewport edges
  const hatches = createHatching();
  for (const h of hatches) {
    document.body.appendChild(h);
    allLines.push(h);
  }

  return allLines;
}

function removeLines(lines: HTMLElement[]) {
  // Animate out
  for (const el of lines) {
    if (el.classList.contains("arch-hatch")) {
      el.style.opacity = "0";
    } else if (el.style.transform?.includes("scaleX")) {
      el.style.transform = "scaleX(0)";
    } else if (el.style.transform?.includes("scaleY")) {
      el.style.transform = "scaleY(0)";
    }
  }

  // Remove after animation
  setTimeout(() => {
    for (const el of lines) {
      el.remove();
    }
    // Clean up position overrides
    const positioned = document.querySelectorAll("[data-arch-positioned]");
    for (const el of positioned) {
      (el as HTMLElement).style.position = "";
      el.removeAttribute("data-arch-positioned");
    }
  }, ANIM_DURATION);
}

export function EditModeLines() {
  const { isEditMode } = useEditMode();
  const linesRef = useRef<HTMLElement[]>([]);
  const [wasEditMode, setWasEditMode] = useState(false);

  const inject = useCallback(() => {
    // Clean up any existing lines first
    const existing = document.querySelectorAll(".arch-line, .arch-hatch");
    for (const el of existing) {
      el.remove();
    }
    linesRef.current = injectLines();
  }, []);

  useEffect(() => {
    if (isEditMode && !wasEditMode) {
      // Entering edit mode — inject lines after a frame to let layout settle
      requestAnimationFrame(() => {
        inject();
      });
      setWasEditMode(true);
    } else if (!isEditMode && wasEditMode) {
      // Exiting edit mode — animate out and remove
      removeLines(linesRef.current);
      linesRef.current = [];
      setWasEditMode(false);
    }
  }, [isEditMode, wasEditMode, inject]);

  // Also keep body class for any remaining hooks
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const existing = document.querySelectorAll(".arch-line, .arch-hatch");
      for (const el of existing) {
        el.remove();
      }
    };
  }, []);

  return null;
}
