"use client";

import { useClerk } from "@clerk/nextjs";
import { AnimatePresence } from "framer-motion";
import {
  ArrowUpDown,
  Eye,
  EyeOff,
  GripVertical,
  Languages,
  LogOut,
  Plus,
  Power,
  RotateCcw,
  Save,
  Trash2,
  TriangleAlert,
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
import { SemanticDot } from "@/components/ui/semantic-dot";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { ChangeSummary } from "./draft-buffer";
import { useEditMode } from "./edit-mode-context";
import { formatEntityRef, formatEntityType } from "./entity-descriptors";
import { getAllSectionLabels } from "./page-boundary";
import {
  formatEditLabel,
  getUndismissedStaleFields,
} from "./save-confirmation";
import { staleCountByLocale } from "./staleness-queries";
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

interface StaleField {
  field: string;
  locale: string;
  section: string;
}

function buildLangTooltip(counts: Map<string, number>): React.ReactNode {
  const enCount = counts.get("en") ?? 0;
  const itCount = counts.get("it") ?? 0;
  if (enCount === 0 && itCount === 0) {
    return "Switch language";
  }
  const parts: string[] = [];
  if (enCount > 0) {
    parts.push(`EN has ${enCount} stale ${enCount === 1 ? "field" : "fields"}`);
  }
  if (itCount > 0) {
    parts.push(`IT has ${itCount} stale ${itCount === 1 ? "field" : "fields"}`);
  }
  return (
    <span className="flex flex-col items-center">
      <span>Switch language</span>
      <span className="text-[10px] opacity-60">{parts.join(", ")}</span>
    </span>
  );
}

interface EditToolbarProps {
  changeSummary: () => ChangeSummary;
  hasChanges: boolean;
  onAutoTranslate: () => void;
  onDiscard: () => void | Promise<void>;
  onSave: () => void | Promise<void>;
  staleFieldCountForLocale: number;
  staleFields: StaleField[];
}

function ToolbarButton({
  "aria-label": ariaLabel,
  children,
  label,
  onClick,
  className,
}: {
  "aria-label"?: string;
  children: React.ReactNode;
  label: React.ReactNode;
  onClick: () => void;
  className: string;
}) {
  const resolvedAriaLabel =
    ariaLabel ?? (typeof label === "string" ? label : undefined);
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          aria-label={resolvedAriaLabel}
          className={className}
          onClick={onClick}
          type="button"
        >
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
  staleFields,
  staleFieldCountForLocale,
  onAutoTranslate,
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

  const counts = staleCountByLocale(staleFields);
  const enStale = (counts.get("en") ?? 0) > 0;
  const itStale = (counts.get("it") ?? 0) > 0;

  if (!isEditMode) {
    return null;
  }

  const langTooltip = buildLangTooltip(counts);

  return (
    <div
      className="fixed z-50 flex items-center gap-1 rounded-full border border-foreground/20 bg-background/80 px-2 py-1.5 shadow-lg backdrop-blur-md"
      data-testid="edit-toolbar"
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
        aria-label="Switch language"
        className="flex h-8 items-center gap-1.5 rounded-full px-3 font-mono text-xs uppercase tracking-wider transition-colors hover:bg-foreground/10"
        label={langTooltip}
        onClick={switchLocale}
      >
        <span className="relative flex items-center gap-0.5">
          <span
            className={
              editingLocale === "en" ? "text-foreground" : "text-foreground/40"
            }
          >
            EN
          </span>
          <AnimatePresence>
            {enStale ? (
              <SemanticDot
                label={`EN has ${counts.get("en")} stale ${counts.get("en") === 1 ? "field" : "fields"}`}
                state="warning"
              />
            ) : null}
          </AnimatePresence>
        </span>
        <span className="text-foreground/20">|</span>
        <span className="relative flex items-center gap-0.5">
          <span
            className={
              editingLocale === "it" ? "text-foreground" : "text-foreground/40"
            }
          >
            IT
          </span>
          <AnimatePresence>
            {itStale ? (
              <SemanticDot
                label={`IT has ${counts.get("it")} stale ${counts.get("it") === 1 ? "field" : "fields"}`}
                state="warning"
              />
            ) : null}
          </AnimatePresence>
        </span>
      </ToolbarButton>

      {staleFieldCountForLocale > 0 ? (
        <ToolbarButton
          className="flex h-8 items-center gap-1.5 rounded-full bg-sky-500/15 px-3 text-sky-400 text-xs transition-colors hover:bg-sky-500/25"
          label={`Translate ${staleFieldCountForLocale} stale ${staleFieldCountForLocale === 1 ? "field" : "fields"}`}
          onClick={onAutoTranslate}
        >
          <Languages className="h-3.5 w-3.5" />
          <span>Translate</span>
        </ToolbarButton>
      ) : null}

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

const artistImageSections = new Map([
  ["artist-image-home", "intro"],
  ["artist-image-essence", "essence.hero"],
]);

function filterArtistImageTextEdits(
  summary: ChangeSummary
): ChangeSummary["textEdits"] {
  const artistImageSectionSet = new Set<string>();
  for (const ref of [...summary.pendingDeletions, ...summary.createdEntities]) {
    const section = artistImageSections.get(ref.entityType);
    if (section) {
      artistImageSectionSet.add(section);
    }
  }

  if (artistImageSectionSet.size === 0) {
    return summary.textEdits;
  }

  return summary.textEdits.filter(
    (edit) =>
      !(
        artistImageSectionSet.has(edit.section) &&
        edit.field.startsWith("portraitImage")
      )
  );
}

function StaleFieldsWarning({
  staleFields,
  sectionLabels,
}: {
  staleFields: { section: string; field: string; locale: string }[];
  sectionLabels: ReadonlyMap<string, string>;
}) {
  if (staleFields.length === 0) {
    return null;
  }
  return (
    <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-amber-400 text-xs">
      <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <div>
        <p className="font-medium">
          {staleFields.length === 1
            ? "1 undismissed stale field:"
            : `${staleFields.length} undismissed stale fields:`}
        </p>
        <ul className="mt-1 space-y-0.5">
          {staleFields.map((sf) => (
            <li key={`${sf.section}\0${sf.field}\0${sf.locale}`}>
              <span className="font-mono">{sf.locale.toUpperCase()}</span>{" "}
              missing for {formatEditLabel(sf, sectionLabels)}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function SaveConfirmDialog({
  open,
  onConfirm,
  onCancel,
  changeSummary,
  loading,
  sectionLabels: sectionLabelsProp,
}: {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  changeSummary: () => ChangeSummary;
  loading: boolean;
  sectionLabels?: ReadonlyMap<string, string>;
}) {
  const summary = open ? changeSummary() : null;
  const sectionLabels =
    sectionLabelsProp ?? (open ? getAllSectionLabels() : new Map());

  const textEdits = summary ? filterArtistImageTextEdits(summary) : [];
  const createdEntities = summary ? summary.createdEntities : [];
  const pendingDeletions = summary ? summary.pendingDeletions : [];

  const hasTextEdits = textEdits.length > 0;
  const hasCreations = createdEntities.length > 0;
  const hasDeletions = pendingDeletions.length > 0;
  const hasPublishOverrides = summary && summary.publishOverrides.length > 0;
  const hasReorder = summary && summary.reorderedEntityTypes.length > 0;

  const undismissedStaleFields = summary
    ? getUndismissedStaleFields({
        ...summary,
        textEdits,
      })
    : [];

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
            ? textEdits.map((edit) => (
                <li
                  className="flex items-baseline gap-2"
                  key={`${edit.section}\0${edit.field}\0${edit.locale}`}
                >
                  <span className="font-mono text-muted-foreground text-xs">
                    {edit.locale.toUpperCase()}
                  </span>
                  <span>{formatEditLabel(edit, sectionLabels)}</span>
                </li>
              ))
            : null}
          {hasCreations
            ? createdEntities.map((ref) => (
                <li
                  className="flex items-baseline gap-2 text-emerald-500"
                  key={`create\0${ref.entityType}\0${ref.id}`}
                >
                  <Plus className="h-3 w-3 shrink-0" />
                  <span>
                    New {formatEntityRef(ref.entityType, ref.id, sectionLabels)}
                  </span>
                </li>
              ))
            : null}
          {hasDeletions
            ? pendingDeletions.map((ref) => (
                <li
                  className="flex items-baseline gap-2 text-destructive"
                  key={`delete\0${ref.entityType}\0${ref.id}`}
                >
                  <Trash2 className="h-3 w-3 shrink-0" />
                  <span>
                    Delete{" "}
                    {formatEntityRef(ref.entityType, ref.id, sectionLabels)}
                  </span>
                </li>
              ))
            : null}
          {hasPublishOverrides
            ? summary?.publishOverrides.map((ovr) => (
                <li
                  className="flex items-baseline gap-2"
                  key={`publish\0${ovr.entityType}\0${ovr.id}`}
                >
                  {ovr.published ? (
                    <Eye className="h-3 w-3 shrink-0 text-emerald-500" />
                  ) : (
                    <EyeOff className="h-3 w-3 shrink-0 text-muted-foreground" />
                  )}
                  <span>
                    {ovr.published ? "Publish" : "Unpublish"}{" "}
                    {formatEntityRef(ovr.entityType, ovr.id, sectionLabels)}
                  </span>
                </li>
              ))
            : null}
          {hasReorder
            ? summary?.reorderedEntityTypes.map((type) => (
                <li
                  className="flex items-baseline gap-2 text-muted-foreground"
                  key={`reorder\0${type}`}
                >
                  <ArrowUpDown className="h-3 w-3 shrink-0" />
                  <span>Reorder {formatEntityType(type)}s</span>
                </li>
              ))
            : null}
        </ul>
        <StaleFieldsWarning
          sectionLabels={sectionLabels}
          staleFields={undismissedStaleFields}
        />
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
  const sectionLabels = open
    ? getAllSectionLabels()
    : new Map<string, string>();

  const textEdits = summary ? filterArtistImageTextEdits(summary) : [];
  const artistImageCreationCount = summary
    ? summary.createdEntities.filter((e) =>
        artistImageSections.has(e.entityType)
      ).length
    : 0;
  const visibleImageSwaps = Math.max(
    0,
    (summary?.imageSwaps.length ?? 0) - artistImageCreationCount
  );
  const editCount = textEdits.length + visibleImageSwaps;
  const dbCreations = summary ? summary.createdEntities : [];
  const hasCreations = summary ? summary.createdEntities.length > 0 : false;

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
          {textEdits.length > 0
            ? textEdits.map((edit) => (
                <li
                  className="flex items-baseline gap-2"
                  key={`${edit.section}\0${edit.field}\0${edit.locale}`}
                >
                  <span className="font-mono text-muted-foreground text-xs">
                    {edit.locale.toUpperCase()}
                  </span>
                  <span className="line-through opacity-60">
                    {formatEditLabel(edit, sectionLabels)}
                  </span>
                </li>
              ))
            : null}
          {visibleImageSwaps > 0 ? (
            <li className="flex items-baseline gap-2">
              <span className="font-mono text-muted-foreground text-xs">
                IMG
              </span>
              <span className="line-through opacity-60">
                {visibleImageSwaps} image{" "}
                {visibleImageSwaps === 1 ? "swap" : "swaps"}
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
                    New {formatEntityRef(ref.entityType, ref.id, sectionLabels)}{" "}
                    will be deleted
                  </span>
                </li>
              ))
            : null}
        </ul>
        {dbCreations.length > 0 ? (
          <p className="text-destructive text-xs">
            {dbCreations.length} newly created{" "}
            {dbCreations.length === 1 ? "entity" : "entities"} will be
            permanently deleted from the database.
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
