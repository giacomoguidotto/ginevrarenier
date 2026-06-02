"use client";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  PointerSensor,
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
import { preloadedQueryResult } from "convex/nextjs";
import type { Preloaded } from "convex/react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef } from "react";
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
import { Section, useSection } from "@/components/admin/section";
import { VisionEmptyState } from "@/components/empty-states/vision-empty-state";
import { ProjectCard } from "@/components/gallery/project-card";
import { PageTransition } from "@/components/layout/page-transition";
import { fadeUp, staggerContainer } from "@/lib/animations";
import { useLocalized } from "@/lib/hooks";

function SortableProjectCard({
  project,
  index,
  isSelected,
}: {
  project: Doc<"projects">;
  index: number;
  isSelected: boolean;
}) {
  const { isEditMode } = useEditMode();
  const { isPendingDeletion, trackDeletion, cancelDeletion } =
    useDraftBufferOps();
  useEditVersion();

  const pendingDeletion = isPendingDeletion("project", project._id);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: project._id,
    disabled: !isEditMode || pendingDeletion,
  });

  const wasDraggingRef = useRef(false);
  useEffect(() => {
    if (isDragging) {
      wasDraggingRef.current = true;
    }
  }, [isDragging]);

  const handleClickCapture = (e: React.MouseEvent) => {
    if (wasDraggingRef.current) {
      e.preventDefault();
      e.stopPropagation();
      wasDraggingRef.current = false;
    }
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      onClickCapture={handleClickCapture}
      ref={setNodeRef}
      style={style}
      {...(isEditMode ? { ...attributes, ...listeners } : {})}
    >
      <ProjectCard
        index={index}
        isSelected={isSelected}
        onCancelDeletion={() => cancelDeletion("project", project._id)}
        onDelete={() => trackDeletion("project", project._id)}
        pendingDeletion={pendingDeletion}
        project={project}
      />
    </div>
  );
}

export function VisionClient({
  preloadedProjects,
}: {
  preloadedProjects?: Preloaded<typeof api.projects.listPublished>;
}) {
  const { isEditMode } = useEditMode();
  const { isAuthenticated } = useConvexAuth();

  const allProjects = useQuery(
    api.projects.list,
    isAuthenticated ? {} : "skip"
  );
  const publishedProjects = useQuery(api.projects.listPublished);
  const preloaded = preloadedProjects
    ? preloadedQueryResult(preloadedProjects)
    : undefined;
  const projects = isEditMode
    ? (allProjects ?? publishedProjects ?? preloaded ?? [])
    : (publishedProjects ?? preloaded ?? []);

  const selectedWorks = useQuery(
    api.selectedWorks.list,
    isAuthenticated && isEditMode ? {} : "skip"
  );
  const selectedProjectIds = useMemo(
    () => new Set(selectedWorks?.map((sw) => sw.projectId)),
    [selectedWorks]
  );

  const { trackCreation, setReorderList, getReorderList } = useDraftBufferOps();
  useEditVersion();
  const createProject = useMutation(api.projects.create);

  const reorderList = getReorderList("project");
  const displayProjects = reorderList
    ? reorderList
        .map((id) => projects.find((p) => p._id === id))
        .filter((p): p is Doc<"projects"> => p !== undefined)
        .concat(projects.filter((p) => !reorderList.includes(p._id)))
    : projects;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) {
        return;
      }
      const oldIndex = displayProjects.findIndex((p) => p._id === active.id);
      const newIndex = displayProjects.findIndex((p) => p._id === over.id);
      if (oldIndex === -1 || newIndex === -1) {
        return;
      }
      const reordered = [...displayProjects];
      const [moved] = reordered.splice(oldIndex, 1);
      reordered.splice(newIndex, 0, moved);
      setReorderList(
        "project",
        reordered.map((p) => p._id)
      );
    },
    [displayProjects, setReorderList]
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
          <Section label="Vision" name="vision.header">
            <ChromeEnablerProvider>
              <VisionHeader />
            </ChromeEnablerProvider>
          </Section>

          {displayProjects.length === 0 ? <VisionEmptyState /> : null}

          {/* Projects Grid */}
          <motion.div
            animate="visible"
            className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3"
            initial="hidden"
            variants={staggerContainer}
          >
            {displayProjects.length > 0 ? (
              <DndContext
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
                sensors={sensors}
              >
                <SortableContext
                  items={displayProjects.map((p) => p._id)}
                  strategy={rectSortingStrategy}
                >
                  {displayProjects.map((project, index) => (
                    <SortableProjectCard
                      index={index}
                      isSelected={selectedProjectIds.has(project._id)}
                      key={project._id}
                      project={project}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            ) : null}

            {/* Create new project card */}
            {isEditMode ? (
              <motion.div variants={fadeUp}>
                <button
                  aria-label="Create project"
                  className="flex aspect-4/5 w-full items-center justify-center rounded-lg border-2 border-foreground/15 border-dashed text-foreground/30 transition-colors hover:border-foreground/30 hover:text-foreground/50"
                  data-testid="create-project-card"
                  onClick={handleCreate}
                  type="button"
                >
                  <Plus className="h-8 w-8" />
                </button>
              </motion.div>
            ) : null}
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
}

function VisionHeader() {
  const { enable } = useChromeEnabler();
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
        onAnimationComplete={enable}
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
