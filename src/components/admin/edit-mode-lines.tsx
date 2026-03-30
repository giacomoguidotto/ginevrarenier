"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";
import { useEditMode } from "./edit-mode-context";

const LINE_COLOR = "oklch(from var(--foreground) l c h / 0.1)";
const LINE_STRONG = "oklch(from var(--foreground) l c h / 0.15)";
const HATCH_COLOR = "oklch(from var(--foreground) l c h / 0.1)";
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
    pointer-events: none; z-index: 1;
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
    pointer-events: none; z-index: 1;
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
 * Call this when the section's enter animations have completed.
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

  // Stagger within section: normalize Y to 0-200ms, X to 0-200ms
  const yDelay = (y: number) => (y / sectionH) * 200;
  const xDelay = (x: number) => (x / vw) * 200;

  // Section top boundary line
  lines.push(section.appendChild(createHLine(0, LINE_STRONG, 0)));

  // Editable fields
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

  // Buttons/links containing editable fields
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

  // Hatching separator at section bottom — appended to main to avoid overflow clip
  const mainEl = section.closest("main");
  if (mainEl) {
    const mainRect = mainEl.getBoundingClientRect();
    const bottomPos = sectionRect.bottom - mainRect.top + window.scrollY;

    const hatch = document.createElement("div");
    hatch.className = "arch-line";
    hatch.style.cssText = `
      position: absolute; left: 0; right: 0; top: ${bottomPos - 8}px;
      height: 16px; pointer-events: none; z-index: 2;
      background-color: var(--background);
      background-image: repeating-linear-gradient(45deg,
        ${LINE_COLOR} 0px, ${LINE_COLOR} 1px, transparent 1px, transparent 4px);
      opacity: 0; transition: opacity ${ANIM_DURATION}ms ease;
    `;
    // Ensure main is positioned
    if (getComputedStyle(mainEl).position === "static") {
      mainEl.style.position = "relative";
      mainEl.setAttribute("data-arch-positioned", "true");
    }
    requestAnimationFrame(() => {
      hatch.style.opacity = "1";
    });
    mainEl.appendChild(hatch);
    lines.push(hatch);
  }

  return lines;
}

function createHatching(): HTMLDivElement[] {
  const strips: HTMLDivElement[] = [];
  for (const side of ["left", "right"] as const) {
    const el = document.createElement("div");
    el.className = "arch-hatch";
    el.style.cssText = `
      position: fixed; top: 0; ${side}: 0;
      width: 20px; height: 100vh;
      pointer-events: none; z-index: 41;
      background-color: var(--background);
      background-image: repeating-linear-gradient(45deg,
        ${HATCH_COLOR} 0px, ${HATCH_COLOR} 1px, transparent 1px, transparent 4px);
      opacity: 0; transition: opacity ${ANIM_DURATION}ms ease;
    `;
    requestAnimationFrame(() => {
      el.style.opacity = "1";
    });
    strips.push(el);
  }
  return strips;
}

function cleanupAll() {
  const existing = document.querySelectorAll(".arch-line, .arch-hatch");
  for (const el of existing) {
    // Animate out
    if ((el as HTMLElement).style.transform?.includes("scaleX")) {
      (el as HTMLElement).style.transform = "scaleX(0)";
    } else if ((el as HTMLElement).style.transform?.includes("scaleY")) {
      (el as HTMLElement).style.transform = "scaleY(0)";
    } else {
      (el as HTMLElement).style.opacity = "0";
    }
  }
  setTimeout(() => {
    const toRemove = document.querySelectorAll(".arch-line, .arch-hatch");
    for (const el of toRemove) {
      el.remove();
    }
    const positioned = document.querySelectorAll("[data-arch-positioned]");
    for (const el of positioned) {
      (el as HTMLElement).style.position = "";
      el.removeAttribute("data-arch-positioned");
    }
  }, ANIM_DURATION);
}

function cleanupImmediate() {
  const existing = document.querySelectorAll(".arch-line, .arch-hatch");
  for (const el of existing) {
    el.remove();
  }
  const positioned = document.querySelectorAll("[data-arch-positioned]");
  for (const el of positioned) {
    (el as HTMLElement).style.position = "";
    el.removeAttribute("data-arch-positioned");
  }
}

/**
 * Global component that manages hatching + cleanup.
 * Individual sections inject their own lines via injectSectionLines().
 */
export function EditModeLines() {
  const { isEditMode } = useEditMode();
  const pathname = usePathname();
  const hatchRef = useRef<HTMLElement[]>([]);

  const injectHatching = useCallback(() => {
    const hatches = createHatching();
    for (const h of hatches) {
      document.body.appendChild(h);
    }
    hatchRef.current = hatches;
  }, []);

  // Hatching on enter/exit
  useEffect(() => {
    if (isEditMode) {
      injectHatching();
    } else {
      cleanupAll();
      hatchRef.current = [];
    }
  }, [isEditMode, injectHatching]);

  // Cleanup on page navigation
  useEffect(() => {
    const _route = pathname;
    if (_route) {
      cleanupImmediate();
      if (isEditMode) {
        injectHatching();
      }
    }
  }, [pathname, isEditMode, injectHatching]);

  // Body class
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
      cleanupImmediate();
    };
  }, []);

  return null;
}
