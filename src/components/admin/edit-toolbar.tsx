"use client";

import { useClerk } from "@clerk/nextjs";
import { GripVertical, LogOut, Power, RotateCcw, Save } from "lucide-react";
import { useLocale } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "@/i18n/routing";
import { useEditMode } from "./edit-mode-context";

const STORAGE_KEY = "edit-toolbar-position";

type Position = { x: number; y: number };

function getInitialPosition(): Position {
  if (typeof window === "undefined") {
    return { x: 20, y: 20 };
  }
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved) as Position;
    }
  } catch {
    // ignore
  }
  return { x: 20, y: window.innerHeight - 80 };
}

type EditToolbarProps = {
  hasChanges: boolean;
  onSave: () => void;
  onDiscard: () => void;
};

export function EditToolbar({
  hasChanges,
  onSave,
  onDiscard,
}: EditToolbarProps) {
  const { isEditMode, exitEditMode } = useEditMode();
  const { signOut } = useClerk();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const [position, setPosition] = useState<Position>(getInitialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  } | null>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

  // Persist position
  useEffect(() => {
    if (!isDragging) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(position));
      } catch {
        // ignore
      }
    }
  }, [position, isDragging]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      setIsDragging(true);
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        origX: position.x,
        origY: position.y,
      };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [position]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!(isDragging && dragRef.current)) {
        return;
      }
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      setPosition({
        x: Math.max(
          0,
          Math.min(window.innerWidth - 300, dragRef.current.origX + dx)
        ),
        y: Math.max(
          0,
          Math.min(window.innerHeight - 60, dragRef.current.origY + dy)
        ),
      });
    },
    [isDragging]
  );

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
    dragRef.current = null;
  }, []);

  const switchLocale = useCallback(() => {
    const nextLocale = locale === "en" ? "it" : "en";
    router.replace(pathname, { locale: nextLocale });
  }, [locale, router, pathname]);

  if (!isEditMode) {
    return null;
  }

  return (
    <div
      className="fixed z-50 flex items-center gap-1 rounded-full border border-foreground/20 bg-background/80 px-2 py-1.5 shadow-lg backdrop-blur-md"
      ref={toolbarRef}
      style={{
        left: position.x,
        top: position.y,
        cursor: isDragging ? "grabbing" : "default",
      }}
    >
      {/* Drag handle */}
      <button
        aria-label="Drag toolbar"
        className="flex h-8 w-6 cursor-grab items-center justify-center text-foreground/40 hover:text-foreground/60 active:cursor-grabbing"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        type="button"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      {/* Language toggle */}
      <button
        className="flex h-8 items-center gap-1 rounded-full px-3 font-mono text-xs uppercase tracking-wider transition-colors hover:bg-foreground/10"
        onClick={switchLocale}
        type="button"
      >
        <span
          className={locale === "en" ? "text-foreground" : "text-foreground/40"}
        >
          EN
        </span>
        <span className="text-foreground/20">|</span>
        <span
          className={locale === "it" ? "text-foreground" : "text-foreground/40"}
        >
          IT
        </span>
      </button>

      {/* Save — only visible with changes */}
      {hasChanges ? (
        <>
          <button
            className="flex h-8 items-center gap-1.5 rounded-full bg-foreground/10 px-3 text-foreground text-xs transition-colors hover:bg-foreground/20"
            onClick={onSave}
            type="button"
          >
            <Save className="h-3.5 w-3.5" />
            <span>Save</span>
          </button>

          <button
            className="flex h-8 items-center gap-1.5 rounded-full px-3 text-foreground/60 text-xs transition-colors hover:bg-foreground/10 hover:text-foreground"
            onClick={onDiscard}
            type="button"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Discard</span>
          </button>
        </>
      ) : null}

      {/* Exit edit mode */}
      <button
        aria-label="Exit edit mode"
        className="flex h-8 w-8 items-center justify-center rounded-full text-foreground/40 transition-colors hover:bg-foreground/10 hover:text-foreground"
        onClick={exitEditMode}
        type="button"
      >
        <LogOut className="h-3.5 w-3.5" />
      </button>

      {/* Sign out */}
      <button
        aria-label="Sign out"
        className="flex h-8 w-8 items-center justify-center rounded-full text-foreground/30 transition-colors hover:bg-red-500/10 hover:text-red-400"
        onClick={() => signOut()}
        type="button"
      >
        <Power className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
