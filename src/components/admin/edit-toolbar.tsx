"use client";

import { useClerk } from "@clerk/nextjs";
import {
  GripVertical,
  LogOut,
  Plus,
  Power,
  RotateCcw,
  Save,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { ChangeSummary } from "./draft-buffer";
import { useEditMode } from "./edit-mode-context";
import { useExitGuard } from "./unsaved-changes-guard";

const STORAGE_KEY = "edit-toolbar-position";

interface Position {
  x: number;
  y: number;
}

function clampPosition(pos: Position): Position {
  if (typeof window === "undefined") {
    return pos;
  }
  return {
    x: Math.max(0, Math.min(pos.x, window.innerWidth - 60)),
    y: Math.max(0, Math.min(pos.y, window.innerHeight - 50)),
  };
}

function getInitialPosition(): Position {
  if (typeof window === "undefined") {
    return { x: 20, y: 20 };
  }
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return clampPosition(JSON.parse(saved) as Position);
    }
  } catch {
    // ignore
  }
  return { x: 20, y: window.innerHeight - 80 };
}

interface EditToolbarProps {
  changeSummary: () => ChangeSummary;
  editedLocales: Set<string>;
  hasChanges: boolean;
  onDiscard: () => void | Promise<void>;
  onSave: () => void | Promise<void>;
}

function ToolbarButton({
  children,
  label,
  onClick,
  className,
}: {
  children: React.ReactNode;
  label: React.ReactNode;
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
  changeSummary,
  hasChanges,
  editedLocales,
  onSave,
  onDiscard,
}: EditToolbarProps) {
  const { isEditMode, editingLocale, setEditingLocale } = useEditMode();
  const { signOut } = useClerk();
  const { requestExit } = useExitGuard();

  const [loading, setLoading] = useState<"save" | "discard" | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<"save" | "discard" | null>(
    null
  );
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

  // Clamp position when viewport resizes
  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => clampPosition(prev));
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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

  const enNeedsAttention = hasChanges && !editedLocales.has("en");
  const itNeedsAttention = hasChanges && !editedLocales.has("it");

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
        className="flex h-8 items-center gap-1.5 rounded-full px-3 font-mono text-xs uppercase tracking-wider transition-colors hover:bg-foreground/10"
        label={
          enNeedsAttention || itNeedsAttention ? (
            <span className="flex flex-col items-center">
              <span>Switch language</span>
              <span className="text-[10px] opacity-60">
                {enNeedsAttention ? "EN" : "IT"} has untranslated changes
              </span>
            </span>
          ) : (
            "Switch language"
          )
        }
        onClick={switchLocale}
      >
        <span className="relative">
          <span
            className={
              editingLocale === "en" ? "text-foreground" : "text-foreground/40"
            }
          >
            EN
          </span>
          {enNeedsAttention ? (
            <span className="absolute -top-1 -right-1.5 h-1.5 w-1.5 rounded-full bg-amber-400" />
          ) : null}
        </span>
        <span className="text-foreground/20">|</span>
        <span className="relative">
          <span
            className={
              editingLocale === "it" ? "text-foreground" : "text-foreground/40"
            }
          >
            IT
          </span>
          {itNeedsAttention ? (
            <span className="absolute -top-1 -right-1.5 h-1.5 w-1.5 rounded-full bg-amber-400" />
          ) : null}
        </span>
      </ToolbarButton>

      {/* Save & Discard — only visible with changes */}
      {hasChanges ? (
        <>
          <ToolbarButton
            className="flex h-8 items-center gap-1.5 rounded-full bg-foreground/10 px-3 text-foreground text-xs transition-colors hover:bg-foreground/20"
            label="Save changes"
            onClick={() => setConfirmDialog("save")}
          >
            {loading === "save" ? (
              <div className="h-3.5 w-3.5 animate-spin rounded-full border border-foreground/20 border-t-foreground" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            <span>Save</span>
          </ToolbarButton>

          <ToolbarButton
            className="flex h-8 items-center gap-1.5 rounded-full px-3 text-foreground/60 text-xs transition-colors hover:bg-foreground/10 hover:text-foreground"
            label="Discard changes"
            onClick={() => setConfirmDialog("discard")}
          >
            {loading === "discard" ? (
              <div className="h-3.5 w-3.5 animate-spin rounded-full border border-foreground/20 border-t-foreground" />
            ) : (
              <RotateCcw className="h-3.5 w-3.5" />
            )}
            <span>Discard</span>
          </ToolbarButton>
        </>
      ) : null}

      {/* Exit edit mode */}
      <ToolbarButton
        className="flex h-8 w-8 items-center justify-center rounded-full text-foreground/40 transition-colors hover:bg-foreground/10 hover:text-foreground"
        label="Exit edit mode"
        onClick={() => requestExit()}
      >
        <LogOut className="h-3.5 w-3.5" />
      </ToolbarButton>

      {/* Sign out */}
      <ToolbarButton
        className="flex h-8 w-8 items-center justify-center rounded-full text-foreground/30 transition-colors hover:bg-red-500/10 hover:text-red-400"
        label="Sign out"
        onClick={() => requestExit(() => signOut())}
      >
        <Power className="h-3.5 w-3.5" />
      </ToolbarButton>

      <SaveConfirmDialog
        changeSummary={changeSummary}
        loading={loading === "save"}
        onCancel={() => setConfirmDialog(null)}
        onConfirm={async () => {
          setLoading("save");
          setConfirmDialog(null);
          await onSave();
          setLoading(null);
        }}
        open={confirmDialog === "save"}
      />

      <DiscardConfirmDialog
        changeSummary={changeSummary}
        loading={loading === "discard"}
        onCancel={() => setConfirmDialog(null)}
        onConfirm={async () => {
          setLoading("discard");
          setConfirmDialog(null);
          await onDiscard();
          setLoading(null);
        }}
        open={confirmDialog === "discard"}
      />
    </div>
  );
}

function formatEditLabel(edit: { section: string; field: string }) {
  return `${edit.section} / ${edit.field}`;
}

function formatEntityType(entityType: string) {
  return entityType === "post" ? "Post" : "Project";
}

function SaveConfirmDialog({
  open,
  onConfirm,
  onCancel,
  changeSummary,
  loading,
}: {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  changeSummary: () => ChangeSummary;
  loading: boolean;
}) {
  const summary = open ? changeSummary() : null;
  const hasTextEdits = summary && summary.textEdits.length > 0;
  const hasCreations = summary && summary.createdEntities.length > 0;
  const hasDeletions = summary && summary.pendingDeletions.length > 0;

  return (
    <Dialog onOpenChange={(v) => !v && onCancel()} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save changes</DialogTitle>
          <DialogDescription>
            The following changes will be saved.
          </DialogDescription>
        </DialogHeader>
        <ul className="max-h-60 space-y-1 overflow-y-auto text-sm">
          {hasTextEdits
            ? summary.textEdits.map((edit) => (
                <li
                  className="flex items-baseline gap-2"
                  key={`${edit.section}\0${edit.field}\0${edit.locale}`}
                >
                  <span className="font-mono text-muted-foreground text-xs">
                    {edit.locale.toUpperCase()}
                  </span>
                  <span>{formatEditLabel(edit)}</span>
                </li>
              ))
            : null}
          {summary && summary.imageSwaps.length > 0 ? (
            <li className="flex items-baseline gap-2">
              <span className="font-mono text-muted-foreground text-xs">
                IMG
              </span>
              <span>
                {summary.imageSwaps.length} image{" "}
                {summary.imageSwaps.length === 1 ? "swap" : "swaps"}
              </span>
            </li>
          ) : null}
          {hasCreations
            ? summary?.createdEntities.map((ref) => (
                <li
                  className="flex items-baseline gap-2 text-emerald-500"
                  key={`create\0${ref.entityType}\0${ref.id}`}
                >
                  <Plus className="h-3 w-3 shrink-0" />
                  <span>New {formatEntityType(ref.entityType)}</span>
                </li>
              ))
            : null}
          {hasDeletions
            ? summary?.pendingDeletions.map((ref) => (
                <li
                  className="flex items-baseline gap-2 text-destructive"
                  key={`delete\0${ref.entityType}\0${ref.id}`}
                >
                  <Trash2 className="h-3 w-3 shrink-0" />
                  <span>Delete {formatEntityType(ref.entityType)}</span>
                </li>
              ))
            : null}
        </ul>
        <DialogFooter>
          <Button onClick={onCancel} variant="outline">
            Cancel
          </Button>
          <Button disabled={loading} onClick={onConfirm}>
            {loading ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DiscardConfirmDialog({
  open,
  onConfirm,
  onCancel,
  changeSummary,
  loading,
}: {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  changeSummary: () => ChangeSummary;
  loading: boolean;
}) {
  const summary = open ? changeSummary() : null;
  const editCount =
    (summary?.textEdits.length ?? 0) + (summary?.imageSwaps.length ?? 0);
  const creationCount = summary?.createdEntities.length ?? 0;
  const hasCreations = creationCount > 0;

  return (
    <Dialog onOpenChange={(v) => !v && onCancel()} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Discard changes</DialogTitle>
          <DialogDescription>
            {editCount > 0
              ? `You have ${editCount} unsaved ${editCount === 1 ? "change" : "changes"} that will be lost.`
              : "All unsaved changes will be lost."}
          </DialogDescription>
        </DialogHeader>
        <ul className="max-h-60 space-y-1 overflow-y-auto text-sm">
          {summary && summary.textEdits.length > 0
            ? summary.textEdits.map((edit) => (
                <li
                  className="flex items-baseline gap-2"
                  key={`${edit.section}\0${edit.field}\0${edit.locale}`}
                >
                  <span className="font-mono text-muted-foreground text-xs">
                    {edit.locale.toUpperCase()}
                  </span>
                  <span className="line-through opacity-60">
                    {formatEditLabel(edit)}
                  </span>
                </li>
              ))
            : null}
          {summary && summary.imageSwaps.length > 0 ? (
            <li className="flex items-baseline gap-2">
              <span className="font-mono text-muted-foreground text-xs">
                IMG
              </span>
              <span className="line-through opacity-60">
                {summary.imageSwaps.length} image{" "}
                {summary.imageSwaps.length === 1 ? "swap" : "swaps"}
              </span>
            </li>
          ) : null}
          {hasCreations
            ? summary?.createdEntities.map((ref) => (
                <li
                  className="flex items-baseline gap-2 text-destructive"
                  key={`create\0${ref.entityType}\0${ref.id}`}
                >
                  <Trash2 className="h-3 w-3 shrink-0" />
                  <span>
                    New {formatEntityType(ref.entityType)} will be deleted
                  </span>
                </li>
              ))
            : null}
        </ul>
        {hasCreations ? (
          <p className="text-destructive text-xs">
            {creationCount} newly created{" "}
            {creationCount === 1 ? "entity" : "entities"} will be permanently
            deleted from the database.
          </p>
        ) : null}
        <DialogFooter>
          <Button onClick={onCancel} variant="outline">
            Cancel
          </Button>
          <Button disabled={loading} onClick={onConfirm} variant="destructive">
            {loading ? "Discarding..." : "Discard"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
