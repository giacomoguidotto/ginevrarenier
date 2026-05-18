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
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { motion } from "framer-motion";
import { Eye, EyeOff, Plus, Trash2, Undo2 } from "lucide-react";
import { useCallback } from "react";
import { useDraftBufferOps } from "@/components/admin/draft-buffer-context";
import { useEditMode } from "@/components/admin/edit-mode-context";
import { Field } from "@/components/admin/field";
import {
  FieldVisibilityProvider,
  useFieldVisibility,
} from "@/components/admin/field-visibility";
import { Section, useSection } from "@/components/admin/section";
import { ProjectCard } from "@/components/gallery/project-card";
import { PageTransition } from "@/components/layout/page-transition";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
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
  const { isPendingDeletion, trackDeletion, cancelDeletion } =
    useDraftBufferOps();
  const updateProject = useMutation(api.projects.update);

  const pendingDeletion = isPendingDeletion("project", project._id);

  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: project._id, disabled: !isEditMode });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  let stateClass = "";
  if (pendingDeletion) {
    stateClass = "opacity-30 grayscale";
  } else if (!project.published && isEditMode) {
    stateClass = "opacity-50";
  }

  const card = (
    <div
      className={stateClass}
      ref={setNodeRef}
      style={style}
      {...(isEditMode ? { ...attributes, ...listeners } : {})}
    >
      <ProjectCard
        index={index}
        pendingDeletion={pendingDeletion}
        project={project}
      />
    </div>
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
        {pendingDeletion ? (
          <ContextMenuItem
            onClick={() => cancelDeletion("project", project._id)}
          >
            <Undo2 className="mr-2 h-4 w-4" />
            Cancel deletion
          </ContextMenuItem>
        ) : (
          <ContextMenuItem
            className="text-red-400 focus:text-red-400"
            onClick={() => trackDeletion("project", project._id)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </ContextMenuItem>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}

export function VisionClient() {
  const { isEditMode } = useEditMode();
  const { isAuthenticated } = useConvexAuth();

  const allProjects = useQuery(
    api.projects.list,
    isEditMode && isAuthenticated ? {} : "skip"
  );
  const publishedProjects = useQuery(
    api.projects.listPublished,
    isEditMode ? "skip" : {}
  );
  const projects = isEditMode ? (allProjects ?? []) : (publishedProjects ?? []);

  const { trackCreation } = useDraftBufferOps();
  const createProject = useMutation(api.projects.create);
  const reorderProjects = useMutation(api.projects.reorder);

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
    const titles = [
      "Solstice",
      "Penumbra",
      "Aperture",
      "Meridian",
      "Parallax",
      "Umbra",
      "Zenith",
      "Cascade",
      "Reverie",
      "Prism",
      "Vestige",
      "Cadence",
      "Eclipse",
      "Gossamer",
      "Nebula",
      "Patina",
      "Silhouette",
      "Trestle",
      "Vignette",
      "Aurora",
      "Chiaroscuro",
      "Sfumato",
      "Contrapposto",
      "Velatura",
      "Nocturne",
    ];
    const title = titles[Math.floor(Math.random() * titles.length)];
    const id = await createProject({
      title: { en: title, it: title },
    });
    trackCreation("project", id);
  }, [createProject, trackCreation]);

  return (
    <PageTransition>
      <div className="min-h-screen pt-32 pb-20">
        <div className="mx-auto max-w-7xl px-6">
          {/* Header */}
          <Section name="vision.header">
            <FieldVisibilityProvider>
              <VisionHeader />
            </FieldVisibilityProvider>
          </Section>

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
                    <button
                      className="flex aspect-4/5 w-full items-center justify-center rounded-lg border-2 border-foreground/15 border-dashed text-foreground/30 transition-colors hover:border-foreground/30 hover:text-foreground/50"
                      onClick={handleCreate}
                      type="button"
                    >
                      <Plus className="h-8 w-8" />
                    </button>
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

function VisionHeader() {
  const { markVisible } = useFieldVisibility();
  const { data } = useSection();
  const localized = useLocalized();

  return (
    <div className="mb-16 max-w-3xl">
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        initial={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.5 }}
      >
        <Field
          as="p"
          className="mb-4 text-foreground/60 text-sm uppercase tracking-widest"
          name="label"
        />
      </motion.div>
      <motion.h1
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 text-foreground"
        initial={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        {data?.title && localized(data.title)}
      </motion.h1>
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        initial={{ opacity: 0, y: 20 }}
        onAnimationComplete={markVisible}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Field
          as="p"
          className="text-lg text-muted-foreground"
          name="description"
        />
      </motion.div>
    </div>
  );
}
