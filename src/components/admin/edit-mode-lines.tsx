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

  // Hatching at section bottom (in main, to avoid overflow clip)
  const mainEl = section.closest("main");
  if (mainEl) {
    const mainRect = mainEl.getBoundingClientRect();
    const bottomPos = sectionRect.bottom - mainRect.top + window.scrollY;
    if (getComputedStyle(mainEl).position === "static") {
      mainEl.style.position = "relative";
      mainEl.setAttribute("data-arch-positioned", "true");
    }
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
    requestAnimationFrame(() => {
      hatch.style.opacity = "1";
    });
    mainEl.appendChild(hatch);
    lines.push(hatch);
  }

  return lines;
}

/**
 * Global component — manages viewport edge hatching + body class.
 * Section lines are managed by useSectionLines() per-section.
 */
export function EditModeLines() {
  const { isEditMode } = useEditMode();
  const pathname = usePathname();
  const hatchRef = useRef<HTMLElement[]>([]);
  const prevPathRef = useRef(pathname);

  const injectHatching = useCallback(() => {
    // Remove old hatches
    for (const h of hatchRef.current) {
      h.remove();
    }
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
      document.body.appendChild(el);
      strips.push(el);
    }
    hatchRef.current = strips;
  }, []);

  const removeHatching = useCallback(() => {
    for (const h of hatchRef.current) {
      h.style.opacity = "0";
    }
    setTimeout(() => {
      for (const h of hatchRef.current) {
        h.remove();
      }
      hatchRef.current = [];
    }, ANIM_DURATION);
  }, []);

  // Hatching + body class on edit mode toggle
  useEffect(() => {
    if (isEditMode) {
      document.body.classList.add("edit-mode");
      injectHatching();
    } else {
      document.body.classList.remove("edit-mode");
      removeHatching();
    }
    return () => {
      document.body.classList.remove("edit-mode");
    };
  }, [isEditMode, injectHatching, removeHatching]);

  // On page navigation: clean up and re-inject hatching
  useEffect(() => {
    if (pathname !== prevPathRef.current) {
      prevPathRef.current = pathname;
      // Section lines are cleaned up by useSectionLines unmounting
      // Just refresh hatching
      if (isEditMode) {
        injectHatching();
      }
    }
  }, [pathname, isEditMode, injectHatching]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      for (const h of hatchRef.current) {
        h.remove();
      }
      const positioned = document.querySelectorAll("[data-arch-positioned]");
      for (const el of positioned) {
        (el as HTMLElement).style.position = "";
        el.removeAttribute("data-arch-positioned");
      }
    };
  }, []);

  return null;
}
