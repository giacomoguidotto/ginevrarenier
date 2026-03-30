"use client";

import { useEffect } from "react";
import { useEditMode } from "./edit-mode-context";

const LINE_COLOR = "oklch(from var(--foreground) l c h / 0.1)";
const LINE_STRONG = "oklch(from var(--foreground) l c h / 0.15)";
const ANIM_DURATION = 400;

function createHLine(
  topPx: number,
  color: string,
  delay: number
): HTMLDivElement {
  const el = document.createElement("div");
  el.className = "arch-line";
  el.style.cssText = `
    position: absolute; left: 0; right: 0; top: ${topPx}px;
    height: 0; border-top: 1px solid ${color};
    pointer-events: none; z-index: 0;
    transform-origin: left; transform: scaleX(0);
    transition: transform ${ANIM_DURATION * 0.4}ms ease-out ${delay}ms;
  `;
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      el.style.transform = "scaleX(1)";
    });
  });
  return el;
}

function createVLine(
  leftPx: number,
  color: string,
  delay: number
): HTMLDivElement {
  const el = document.createElement("div");
  el.className = "arch-line";
  el.style.cssText = `
    position: absolute; top: 0; bottom: 0; left: ${leftPx}px;
    width: 0; border-left: 1px solid ${color};
    pointer-events: none; z-index: 0;
    transform-origin: top; transform: scaleY(0);
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
 * Inject architectural lines for a single section element.
 * Returns the created line elements for later cleanup.
 */
export function injectSectionLines(section: HTMLElement): HTMLElement[] {
  const lines: HTMLElement[] = [];
  const vw = window.innerWidth;
  const sectionH = section.scrollHeight;

  const computed = getComputedStyle(section);
  if (computed.position === "static") {
    section.style.position = "relative";
    section.setAttribute("data-arch-positioned", "true");
  }

  const sectionRect = section.getBoundingClientRect();
  const yDelay = (y: number) => (y / sectionH) * 200;
  const xDelay = (x: number) => (x / vw) * 200;

  // Section top boundary
  lines.push(section.appendChild(createHLine(0, LINE_STRONG, 0)));

  // Editable fields (skip those inside buttons/links)
  const fields = section.querySelectorAll(".editable-field");
  for (const field of fields) {
    if (field.closest("a") || field.closest("button")) {
      continue;
    }
    const r = field.getBoundingClientRect();
    const relTop = r.top - sectionRect.top + section.scrollTop;
    const relBottom = relTop + r.height;
    const relLeft = r.left - sectionRect.left;
    const relRight = relLeft + r.width;

    lines.push(
      section.appendChild(createHLine(relTop, LINE_COLOR, yDelay(relTop)))
    );
    lines.push(
      section.appendChild(createHLine(relBottom, LINE_COLOR, yDelay(relBottom)))
    );
    lines.push(
      section.appendChild(createVLine(relLeft, LINE_COLOR, xDelay(relLeft)))
    );
    lines.push(
      section.appendChild(createVLine(relRight, LINE_COLOR, xDelay(relRight)))
    );
  }

  // Buttons/links with editable fields
  const buttons = section.querySelectorAll(
    "a:has(.editable-field), button:has(.editable-field)"
  );
  for (const btn of buttons) {
    const r = btn.getBoundingClientRect();
    const relTop = r.top - sectionRect.top + section.scrollTop;
    const relBottom = relTop + r.height;
    const relLeft = r.left - sectionRect.left;
    const relRight = relLeft + r.width;

    lines.push(
      section.appendChild(createHLine(relTop, LINE_COLOR, yDelay(relTop)))
    );
    lines.push(
      section.appendChild(createHLine(relBottom, LINE_COLOR, yDelay(relBottom)))
    );
    lines.push(
      section.appendChild(createVLine(relLeft, LINE_COLOR, xDelay(relLeft)))
    );
    lines.push(
      section.appendChild(createVLine(relRight, LINE_COLOR, xDelay(relRight)))
    );
  }

  // Hatching separator after section — inserted as sibling, height:0 + overflow:visible = no CLS
  const hatch = document.createElement("div");
  hatch.className = "arch-line";
  hatch.style.cssText = `
    height: 0; overflow: visible; position: relative; z-index: 2;
    pointer-events: none;
  `;
  const hatchInner = document.createElement("div");
  hatchInner.style.cssText = `
    position: absolute; left: 0; right: 0; top: -8px;
    height: 16px;
    background-color: var(--background);
    background-image: repeating-linear-gradient(45deg,
      ${LINE_COLOR} 0px, ${LINE_COLOR} 1px, transparent 1px, transparent 4px);
    opacity: 0; transition: opacity ${ANIM_DURATION}ms ease;
  `;
  hatch.appendChild(hatchInner);
  section.after(hatch);
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      hatchInner.style.opacity = "1";
    });
  });
  lines.push(hatch);

  return lines;
}

/**
 * Global component — manages body class.
 * Section lines + hatching are managed by useSectionLines() per-section.
 */
export function EditModeLines() {
  const { isEditMode } = useEditMode();

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

  return null;
}
