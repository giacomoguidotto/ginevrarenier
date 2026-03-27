"use client";

import { useClerk } from "@clerk/nextjs";
import { GripVertical, LogOut, Power, RotateCcw, Save } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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

function ToolbarButton({
  children,
  label,
  onClick,
  className,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  className: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button className={className} onClick={onClick} type="button">
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" sideOffset={8}>
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

export function EditToolbar({
  hasChanges,
  onSave,
  onDiscard,
}: EditToolbarProps) {
  const { isEditMode, editingLocale, exitEditMode, setEditingLocale } =
    useEditMode();
  const { signOut } = useClerk();

  const [position, setPosition] = useState<Position>(getInitialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  } | null>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

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
    setEditingLocale(editingLocale === "en" ? "it" : "en");
  }, [editingLocale, setEditingLocale]);

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
      <ToolbarButton
        className="flex h-8 items-center gap-1 rounded-full px-3 font-mono text-xs uppercase tracking-wider transition-colors hover:bg-foreground/10"
        label="Switch language"
        onClick={switchLocale}
      >
        <span
          className={
            editingLocale === "en" ? "text-foreground" : "text-foreground/40"
          }
        >
          EN
        </span>
        <span className="text-foreground/20">|</span>
        <span
          className={
            editingLocale === "it" ? "text-foreground" : "text-foreground/40"
          }
        >
          IT
        </span>
      </ToolbarButton>

      {/* Save & Discard — only visible with changes */}
      {hasChanges ? (
        <>
          <ToolbarButton
            className="flex h-8 items-center gap-1.5 rounded-full bg-foreground/10 px-3 text-foreground text-xs transition-colors hover:bg-foreground/20"
            label="Save changes"
            onClick={onSave}
          >
            <Save className="h-3.5 w-3.5" />
            <span>Save</span>
          </ToolbarButton>

          <ToolbarButton
            className="flex h-8 items-center gap-1.5 rounded-full px-3 text-foreground/60 text-xs transition-colors hover:bg-foreground/10 hover:text-foreground"
            label="Discard changes"
            onClick={onDiscard}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Discard</span>
          </ToolbarButton>
        </>
      ) : null}

      {/* Exit edit mode */}
      <ToolbarButton
        className="flex h-8 w-8 items-center justify-center rounded-full text-foreground/40 transition-colors hover:bg-foreground/10 hover:text-foreground"
        label="Exit edit mode"
        onClick={exitEditMode}
      >
        <LogOut className="h-3.5 w-3.5" />
      </ToolbarButton>

      {/* Sign out */}
      <ToolbarButton
        className="flex h-8 w-8 items-center justify-center rounded-full text-foreground/30 transition-colors hover:bg-red-500/10 hover:text-red-400"
        label="Sign out"
        onClick={async () => {
          await signOut();
          window.location.reload();
        }}
      >
        <Power className="h-3.5 w-3.5" />
      </ToolbarButton>
    </div>
  );
}
