"use client";

import { api } from "convex/_generated/api";
import type { Doc } from "convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { motion } from "framer-motion";
import { ArrowUpRight, Trash2, Undo2 } from "lucide-react";
import Image from "next/image";
import { useEditMode } from "@/components/admin/edit-mode-context";
import { Field } from "@/components/admin/field";
import {
  FieldVisibilityProvider,
  useFieldVisibility,
} from "@/components/admin/field-visibility";
import { Section } from "@/components/admin/section";
import { Link } from "@/i18n/routing";
import { fadeUp } from "@/lib/animations";
import { useLocalized } from "@/lib/hooks";

type Project = Doc<"projects">;

export function ProjectCard({
  project,
  index,
  pendingDeletion,
  onDelete,
  onCancelDeletion,
}: {
  project: Project;
  index: number;
  pendingDeletion?: boolean;
  onDelete?: () => void;
  onCancelDeletion?: () => void;
}) {
  const { isEditMode } = useEditMode();

  if (isEditMode) {
    return (
      <Section name={`project:${project._id}`}>
        <FieldVisibilityProvider>
          <CardContent
            index={index}
            onCancelDeletion={onCancelDeletion}
            onDelete={onDelete}
            pendingDeletion={pendingDeletion}
            project={project}
          />
        </FieldVisibilityProvider>
      </Section>
    );
  }

  return <CardContent index={index} project={project} />;
}

function CardContent({
  project,
  index,
  pendingDeletion,
  onDelete,
  onCancelDeletion,
}: {
  project: Project;
  index: number;
  pendingDeletion?: boolean;
  onDelete?: () => void;
  onCancelDeletion?: () => void;
}) {
  const { isEditMode } = useEditMode();
  const { markVisible } = useFieldVisibility();
  const localized = useLocalized();
  const updateProject = useMutation(api.projects.update);
  const coverSrc = project.coverImageUrl || "/images/placeholder.svg";

  let contentClass = "";
  if (isEditMode) {
    if (pendingDeletion) {
      contentClass = "opacity-30 grayscale";
    } else if (!project.published) {
      contentClass = "opacity-50";
    }
  }

  return (
    <motion.div
      className={`group relative ${isEditMode ? "edit-locked" : ""}`}
      custom={index}
      onAnimationComplete={markVisible}
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
                />
                <Field
                  as="h3"
                  className="font-light text-2xl text-cream"
                  name="title"
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

      {isEditMode && pendingDeletion && onCancelDeletion && (
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
      )}

      {isEditMode && !pendingDeletion && (
        <div
          className="absolute top-6 right-6 z-10 flex items-center gap-1.5"
          onPointerDown={(e) => e.stopPropagation()}
        >
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
          {!project.published && (
            <button
              className="flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 font-medium text-[11px] text-primary-foreground uppercase tracking-wider transition-all hover:bg-primary/90 hover:shadow-md"
              data-testid="card-publish-button"
              onClick={() =>
                updateProject({ id: project._id, published: true })
              }
              type="button"
            >
              <ArrowUpRight className="h-3 w-3" />
              Publish
            </button>
          )}
        </div>
      )}

      {isEditMode && pendingDeletion && (
        <div className="absolute top-6 left-6 z-10 rounded bg-destructive/20 px-2 py-0.5 font-mono text-[10px] text-destructive uppercase backdrop-blur-sm">
          Pending deletion
        </div>
      )}
      {isEditMode && !pendingDeletion && !project.published && (
        <div className="absolute top-6 left-6 z-10 rounded bg-foreground/10 px-2 py-0.5 font-mono text-[10px] text-foreground/50 uppercase backdrop-blur-sm">
          Draft
        </div>
      )}
    </motion.div>
  );
}
