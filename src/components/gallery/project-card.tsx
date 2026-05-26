"use client";

import type { Doc } from "convex/_generated/dataModel";
import { motion } from "framer-motion";
import { ArrowUpRight, EyeOff, Star, Trash2, Undo2 } from "lucide-react";
import Image from "next/image";
import {
  ChromeEnablerProvider,
  useChromeEnabler,
} from "@/components/admin/chrome-enabler";
import {
  useDraftBufferOps,
  useEditVersion,
} from "@/components/admin/draft-buffer-context";
import { useEditMode } from "@/components/admin/edit-mode-context";
import { Field } from "@/components/admin/field";
import { Section } from "@/components/admin/section";
import { StatusBadge } from "@/components/admin/status-badge";
import { Link } from "@/i18n/routing";
import { fadeUp } from "@/lib/animations";
import { useLocalized } from "@/lib/hooks";

type Project = Doc<"projects">;

export function ProjectCard({
  project,
  index,
  isSelected,
  pendingDeletion,
  onDelete,
  onCancelDeletion,
}: {
  project: Project;
  index: number;
  isSelected?: boolean;
  pendingDeletion?: boolean;
  onDelete?: () => void;
  onCancelDeletion?: () => void;
}) {
  const { isEditMode } = useEditMode();

  return (
    <Section
      label={`Project: ${project.title.en}`}
      name={`project:${project._id}`}
    >
      <ChromeEnablerProvider active={isEditMode}>
        <CardContent
          index={index}
          isSelected={isSelected}
          onCancelDeletion={onCancelDeletion}
          onDelete={onDelete}
          pendingDeletion={pendingDeletion}
          project={project}
        />
      </ChromeEnablerProvider>
    </Section>
  );
}

function CardActions({
  effectivePublished,
  effectiveSelected,
  onCancelDeletion,
  onDelete,
  onTogglePublish,
  onToggleSelect,
  pendingDeletion,
  publishOverride,
}: {
  effectivePublished: boolean;
  effectiveSelected: boolean;
  onCancelDeletion?: () => void;
  onDelete?: () => void;
  onTogglePublish: () => void;
  onToggleSelect: () => void;
  pendingDeletion?: boolean;
  publishOverride: boolean | undefined;
}) {
  if (pendingDeletion && onCancelDeletion) {
    return (
      <button
        className="absolute top-6 right-6 z-10 flex items-center gap-1.5 rounded-full bg-destructive/90 px-3 py-1 font-medium text-[11px] text-white uppercase tracking-wider transition-all hover:bg-destructive hover:shadow-md"
        data-testid="card-cancel-deletion-button"
        onClick={onCancelDeletion}
        onPointerDown={(e) => e.stopPropagation()}
        type="button"
      >
        <Undo2 className="h-3 w-3" />
        Cancel deletion
      </button>
    );
  }

  if (publishOverride === true) {
    return (
      <button
        className="absolute top-6 right-6 z-10 flex items-center gap-1.5 rounded-full bg-foreground/20 px-3 py-1 font-medium text-[11px] text-foreground uppercase tracking-wider transition-all hover:bg-foreground/30 hover:shadow-md"
        data-testid="card-cancel-publish-button"
        onClick={onTogglePublish}
        onPointerDown={(e) => e.stopPropagation()}
        type="button"
      >
        <Undo2 className="h-3 w-3" />
        Cancel publish
      </button>
    );
  }

  return (
    <div
      className="absolute top-6 right-6 z-10 flex items-center gap-1.5"
      onPointerDown={(e) => e.stopPropagation()}
    >
      <button
        className={`flex items-center rounded-full p-1.5 transition-all hover:shadow-md ${
          effectiveSelected
            ? "bg-amber-500/80 text-white hover:bg-amber-500"
            : "bg-foreground/20 text-foreground hover:bg-foreground/30"
        }`}
        data-testid="card-select-button"
        onClick={onToggleSelect}
        type="button"
      >
        <Star
          className={`h-3 w-3 ${effectiveSelected ? "fill-amber-300 text-amber-300" : ""}`}
        />
      </button>
      {onDelete && (
        <button
          className="flex items-center rounded-full bg-destructive/80 p-1.5 text-white transition-all hover:bg-destructive hover:shadow-md"
          data-testid="card-delete-button"
          onClick={onDelete}
          type="button"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      )}
      {effectivePublished ? (
        <button
          className="flex items-center rounded-full bg-foreground/20 p-1.5 text-foreground transition-all hover:bg-foreground/30 hover:shadow-md"
          data-testid="card-unpublish-button"
          onClick={onTogglePublish}
          type="button"
        >
          <EyeOff className="h-3 w-3" />
        </button>
      ) : (
        <button
          className="flex items-center rounded-full bg-primary p-1.5 text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-md"
          data-testid="card-publish-button"
          onClick={onTogglePublish}
          type="button"
        >
          <ArrowUpRight className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

function CardContent({
  project,
  index,
  isSelected,
  pendingDeletion,
  onDelete,
  onCancelDeletion,
}: {
  project: Project;
  index: number;
  isSelected?: boolean;
  pendingDeletion?: boolean;
  onDelete?: () => void;
  onCancelDeletion?: () => void;
}) {
  const { isEditMode } = useEditMode();
  const { enable } = useChromeEnabler();
  const localized = useLocalized();
  const {
    getPublishOverride,
    setPublishOverride,
    clearPublishOverride,
    getSelectionOverride,
    setSelectionOverride,
    clearSelectionOverride,
  } = useDraftBufferOps();
  useEditVersion();
  const coverSrc = project.coverImageUrl || "/images/placeholder.svg";

  const publishOverride = getPublishOverride("project", project._id);
  const effectivePublished =
    publishOverride === undefined ? project.published : publishOverride;

  let contentClass = "";
  if (isEditMode) {
    if (pendingDeletion) {
      contentClass = "opacity-30 grayscale";
    } else if (!effectivePublished) {
      contentClass = "opacity-50";
    }
  }

  const handleTogglePublish = () => {
    const target = !effectivePublished;
    if (target === project.published) {
      clearPublishOverride("project", project._id);
    } else {
      setPublishOverride("project", project._id, target);
    }
  };

  const selectionOverride = getSelectionOverride(project._id);
  const effectiveSelected =
    selectionOverride === undefined ? (isSelected ?? false) : selectionOverride;

  const handleToggleSelect = () => {
    const target = !effectiveSelected;
    if (target === (isSelected ?? false)) {
      clearSelectionOverride(project._id);
    } else {
      setSelectionOverride(project._id, target);
    }
  };

  return (
    <motion.div
      className={`group relative ${isEditMode ? "edit-locked" : ""}`}
      custom={index}
      onAnimationComplete={enable}
      variants={fadeUp}
    >
      <Link
        className={`block overflow-hidden rounded-lg ${contentClass}`}
        href={`/vision/${project.slug}`}
      >
        <div className="relative z-[1] aspect-4/5 overflow-hidden">
          <Image
            alt={localized(project.title)}
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            src={coverSrc}
          />
          <div className="absolute inset-0 bg-linear-to-t from-charcoal/90 via-charcoal/20 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
          {/* biome-ignore lint/a11y/noNoninteractiveElementInteractions: overlay intercepts events to prevent link navigation and drag activation while editing */}
          {/* biome-ignore lint/a11y/noStaticElementInteractions: see above */}
          {/* biome-ignore lint/a11y/useKeyWithClickEvents: defensive handler only */}
          <div
            className={`absolute right-0 bottom-0 left-0 p-6 transition-all duration-500 ${
              isEditMode
                ? "translate-y-0 opacity-100"
                : "translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100"
            }`}
            data-testid="card-overlay"
            onClick={
              isEditMode
                ? (e: React.MouseEvent) => e.preventDefault()
                : undefined
            }
            onPointerDown={
              isEditMode
                ? (e: React.PointerEvent) => e.stopPropagation()
                : undefined
            }
          >
            {isEditMode ? (
              <>
                <Field
                  as="p"
                  className="mb-2 text-cream/60 text-xs uppercase tracking-widest"
                  name="tagline"
                  readOnly={pendingDeletion}
                />
                <Field
                  as="h3"
                  className="font-light text-2xl text-cream"
                  name="title"
                  readOnly={pendingDeletion}
                />
              </>
            ) : (
              <>
                <p className="mb-2 text-cream/60 text-xs uppercase tracking-widest">
                  {localized(project.tagline)}
                </p>
                <h3 className="font-light text-2xl text-cream">
                  {localized(project.title)}
                </h3>
              </>
            )}
          </div>
        </div>

        {!isEditMode && (
          <div
            className="mt-4 transition-opacity duration-500 group-hover:opacity-0"
            data-testid="card-static-title"
          >
            <h3 className="font-light text-foreground text-xl">
              {localized(project.title)}
            </h3>
          </div>
        )}
      </Link>

      {isEditMode && (
        <CardActions
          effectivePublished={effectivePublished}
          effectiveSelected={effectiveSelected}
          onCancelDeletion={onCancelDeletion}
          onDelete={onDelete}
          onTogglePublish={handleTogglePublish}
          onToggleSelect={handleToggleSelect}
          pendingDeletion={pendingDeletion}
          publishOverride={publishOverride}
        />
      )}

      {isEditMode && (
        <StatusBadge
          className="top-6 left-6"
          pendingDeletion={pendingDeletion}
          published={project.published}
          publishOverride={publishOverride}
        />
      )}
    </motion.div>
  );
}
