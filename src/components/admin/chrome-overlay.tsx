"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useChromeRegistry } from "./chrome-context";
import type { FieldGeometry } from "./chrome-registry";
import { useEditMode } from "./edit-mode-context";

const SPRING = { type: "spring" as const, stiffness: 200, damping: 25 };

interface OverlayRect {
  height: number;
  id: string;
  width: number;
  x: number;
  y: number;
}

function toOverlayRects(geometry: FieldGeometry[]): OverlayRect[] {
  return geometry.map(({ id, rect }) => ({
    id,
    x: rect.left + window.scrollX,
    y: rect.top + window.scrollY,
    width: rect.width,
    height: rect.height,
  }));
}

function FieldOutline({ rect }: { rect: OverlayRect }) {
  const perimeter = 2 * (rect.width + rect.height);

  return (
    <motion.g
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      initial={{ opacity: 0 }}
      key={rect.id}
      transition={SPRING}
    >
      {/* Animated outline — draws from top-left to bottom-right */}
      <motion.rect
        animate={{ strokeDashoffset: 0 }}
        exit={{ strokeDashoffset: perimeter }}
        fill="none"
        height={rect.height}
        initial={{ strokeDashoffset: perimeter }}
        stroke="oklch(from var(--foreground) l c h / 0.15)"
        strokeDasharray={perimeter}
        strokeWidth={1}
        transition={SPRING}
        width={rect.width}
        x={rect.x}
        y={rect.y}
      />

      {/* Hatching pattern fill — fades in */}
      <motion.rect
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        fill="url(#chrome-hatching)"
        height={rect.height}
        initial={{ opacity: 0 }}
        transition={{ ...SPRING, delay: 0.1 }}
        width={rect.width}
        x={rect.x}
        y={rect.y}
      />
    </motion.g>
  );
}

export function ChromeOverlay() {
  const { isEditMode } = useEditMode();
  const registry = useChromeRegistry();
  const [rects, setRects] = useState<OverlayRect[]>([]);
  const observerRef = useRef<ResizeObserver | null>(null);
  const rafRef = useRef<number>(0);

  const refresh = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      setRects(toOverlayRects(registry.getActiveGeometry()));
    });
  }, [registry]);

  useEffect(() => {
    if (!isEditMode) {
      setRects([]);
      return;
    }

    refresh();
    const unsubscribe = registry.subscribe(refresh);

    observerRef.current = new ResizeObserver(refresh);
    for (const { element } of registry.getAll()) {
      observerRef.current.observe(element);
    }

    const onScroll = () => refresh();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    return () => {
      unsubscribe();
      observerRef.current?.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(rafRef.current);
    };
  }, [isEditMode, registry, refresh]);

  useEffect(() => {
    if (!(isEditMode && observerRef.current)) {
      return;
    }

    const unsub = registry.subscribe(() => {
      const observer = observerRef.current;
      if (!observer) {
        return;
      }
      observer.disconnect();
      for (const { element } of registry.getAll()) {
        observer.observe(element);
      }
    });

    return unsub;
  }, [isEditMode, registry]);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return null;
  }

  return createPortal(
    <svg
      aria-hidden="true"
      data-chrome-overlay
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: document.documentElement.scrollHeight,
        pointerEvents: "none",
        zIndex: 50,
        overflow: "visible",
      }}
    >
      <defs>
        <pattern
          height="4"
          id="chrome-hatching"
          patternTransform="rotate(45)"
          patternUnits="userSpaceOnUse"
          width="4"
        >
          <line
            stroke="oklch(from var(--foreground) l c h / 0.05)"
            strokeWidth="1"
            x1="0"
            x2="0"
            y1="0"
            y2="4"
          />
        </pattern>
      </defs>

      <AnimatePresence>
        {isEditMode &&
          rects.map((rect) => <FieldOutline key={rect.id} rect={rect} />)}
      </AnimatePresence>
    </svg>,
    document.body
  );
}
