"use client";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  rectSortingStrategy,
  SortableContext,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { api } from "convex/_generated/api";
import type { Doc } from "convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { motion } from "framer-motion";
import { Eye, EyeOff, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import { useEditMode } from "@/components/admin/edit-mode-context";
import { PageTransition } from "@/components/layout/page-transition";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Link } from "@/i18n/routing";
import { fadeUp, staggerContainer } from "@/lib/animations";
import { useLocalized } from "@/lib/hooks";

function SortableProjectCard({
  project,
  index,
}: {
  project: Doc<"projects">;
  index: number;
}) {
  const { isEditMode } = useEditMode();
  const localized = useLocalized();
  const _t = useTranslations("common");
  const updateProject = useMutation(api.projects.update);
  const removeProject = useMutation(api.projects.remove);

  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: project._id, disabled: !isEditMode });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const coverSrc =
    project.coverImageUrl || `/images/projects/${project.slug}/cover.svg`;

  const card = (
    <motion.div
      className={`group relative ${!project.published && isEditMode ? "opacity-50" : ""}`}
      custom={index}
      ref={setNodeRef}
      style={style}
      variants={fadeUp}
      {...(isEditMode ? { ...attributes, ...listeners } : {})}
    >
      <Link
        className="block overflow-hidden rounded-lg"
        href={`/vision/${project.slug}`}
      >
        <div className="relative aspect-4/5 overflow-hidden">
          <Image
            alt={localized(project.title)}
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            src={coverSrc}
          />
          <div className="absolute inset-0 bg-linear-to-t from-charcoal/90 via-charcoal/20 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        </div>
        <div className="mt-4 transition-opacity duration-500 group-hover:opacity-0">
          <p className="mb-1 text-muted-foreground text-xs uppercase tracking-widest">
            {localized(project.category)}
          </p>
          <h3 className="font-light text-foreground text-xl">
            {localized(project.title)}
          </h3>
        </div>
      </Link>

      {/* Unpublished badge */}
      {!project.published && isEditMode ? (
        <div className="absolute top-2 left-2 rounded bg-foreground/10 px-2 py-0.5 font-mono text-[10px] text-foreground/50 uppercase backdrop-blur-sm">
          Draft
        </div>
      ) : null}
    </motion.div>
  );

  if (!isEditMode) {
    return card;
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{card}</ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem
          onClick={() =>
            updateProject({
              id: project._id,
              published: !project.published,
            })
          }
        >
          {project.published ? (
            <>
              <EyeOff className="mr-2 h-4 w-4" /> Unpublish
            </>
          ) : (
            <>
              <Eye className="mr-2 h-4 w-4" /> Publish
            </>
          )}
        </ContextMenuItem>
        <ContextMenuItem
          className="text-red-400 focus:text-red-400"
          onClick={() => removeProject({ id: project._id })}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

export function VisionClient() {
  const t = useTranslations("vision");
  const { isEditMode } = useEditMode();

  // In edit mode, show all projects (including unpublished). Otherwise published only.
  const allProjects = useQuery(api.projects.list);
  const publishedProjects = useQuery(api.projects.listPublished);
  const projects = isEditMode ? (allProjects ?? []) : (publishedProjects ?? []);

  const createProject = useMutation(api.projects.create);
  const reorderProjects = useMutation(api.projects.reorder);

  const [creating, setCreating] = useState(false);
  const [newSlug, setNewSlug] = useState("");

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    })
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) {
        return;
      }
      const oldIndex = projects.findIndex((p) => p._id === active.id);
      const newIndex = projects.findIndex((p) => p._id === over.id);
      if (oldIndex === -1 || newIndex === -1) {
        return;
      }
      const reordered = [...projects];
      const [moved] = reordered.splice(oldIndex, 1);
      reordered.splice(newIndex, 0, moved);
      reorderProjects({ ids: reordered.map((p) => p._id) });
    },
    [projects, reorderProjects]
  );

  const handleCreate = useCallback(async () => {
    if (!newSlug.trim()) {
      return;
    }
    const slug = newSlug.trim().toLowerCase().replace(/\s+/g, "-");
    await createProject({
      slug,
      title: { en: slug, it: slug },
      subtitle: { en: "", it: "" },
      description: { en: "", it: "" },
      category: { en: "", it: "" },
    });
    setNewSlug("");
    setCreating(false);
  }, [newSlug, createProject]);

  return (
    <PageTransition>
      <div className="min-h-screen pt-32 pb-20">
        <div className="mx-auto max-w-7xl px-6">
          {/* Header */}
          <div className="mb-16 max-w-3xl">
            <p className="mb-4 text-foreground/60 text-sm uppercase tracking-widest">
              {t("label")}
            </p>
            <h1 className="mb-6 text-foreground">{t("title")}</h1>
            <p className="text-lg text-muted-foreground">{t("description")}</p>
          </div>

          {/* Projects Grid */}
          <DndContext
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            sensors={sensors}
          >
            <SortableContext
              items={projects.map((p) => p._id)}
              strategy={rectSortingStrategy}
            >
              <motion.div
                animate="visible"
                className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3"
                initial="hidden"
                variants={staggerContainer}
              >
                {projects.map((project, index) => (
                  <SortableProjectCard
                    index={index}
                    key={project._id}
                    project={project}
                  />
                ))}

                {/* Create new project card */}
                {isEditMode ? (
                  <motion.div variants={fadeUp}>
                    {creating ? (
                      <div className="flex aspect-4/5 flex-col items-center justify-center gap-4 rounded-lg border-2 border-foreground/15 border-dashed p-6">
                        <input
                          autoFocus
                          className="w-full rounded bg-transparent px-3 py-2 text-center text-foreground outline-none ring-1 ring-foreground/20 placeholder:text-foreground/30 focus:ring-foreground/40"
                          onChange={(e) => setNewSlug(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleCreate();
                            }
                            if (e.key === "Escape") {
                              setCreating(false);
                              setNewSlug("");
                            }
                          }}
                          placeholder="project-slug"
                          value={newSlug}
                        />
                        <div className="flex gap-2">
                          <button
                            className="rounded-full bg-foreground/10 px-4 py-1.5 text-foreground text-xs transition-colors hover:bg-foreground/20"
                            onClick={handleCreate}
                            type="button"
                          >
                            Create
                          </button>
                          <button
                            className="rounded-full px-4 py-1.5 text-foreground/50 text-xs transition-colors hover:text-foreground"
                            onClick={() => {
                              setCreating(false);
                              setNewSlug("");
                            }}
                            type="button"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        className="flex aspect-4/5 w-full items-center justify-center rounded-lg border-2 border-foreground/15 border-dashed text-foreground/30 transition-colors hover:border-foreground/30 hover:text-foreground/50"
                        onClick={() => setCreating(true)}
                        type="button"
                      >
                        <Plus className="h-8 w-8" />
                      </button>
                    )}
                  </motion.div>
                ) : null}
              </motion.div>
            </SortableContext>
          </DndContext>
        </div>
      </div>
    </PageTransition>
  );
}
