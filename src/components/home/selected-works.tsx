"use client";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
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
import { useConvexAuth, useQuery } from "convex/react";
import {
  AnimatePresence,
  motion,
  useScroll,
  useTransform,
} from "framer-motion";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  GripVertical,
  LayoutGrid,
  Star,
  X,
} from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { SubscribeForm } from "@/components/subscribe-form";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { Link } from "@/i18n/routing";
import { useLocalized } from "@/lib/hooks";

function SelectedWorkCard({
  project,
  index,
}: {
  project: Doc<"projects">;
  index: number;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: cardRef,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [100, -100]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.8, 1, 0.8]);

  const t = useTranslations("common");
  const localized = useLocalized();

  const coverSrc = project.coverImageUrl || "/images/placeholder.svg";

  return (
    <motion.div
      className="group relative h-[70vh] min-w-[80vw] snap-center overflow-hidden rounded-lg md:min-w-[40vw]"
      data-card
      initial={{ opacity: 0, x: 100 }}
      ref={cardRef}
      transition={{
        duration: 0.8,
        delay: index * 0.1,
        ease: [0.16, 1, 0.3, 1],
      }}
      viewport={{ once: true }}
      whileHover={{ scale: 1.02 }}
      whileInView={{ opacity: 1, x: 0 }}
      whileTap={{ scale: 0.98 }}
    >
      <Link className="block h-full w-full" href={`/vision/${project.slug}`}>
        {/* Image */}
        <motion.div className="relative h-full w-full" style={{ scale }}>
          <Image
            alt={localized(project.title)}
            className="object-cover"
            fill
            sizes="(max-width: 768px) 80vw, 40vw"
            src={coverSrc}
          />
          {/* Overlay - always dark for consistent text contrast */}
          <div className="absolute inset-0 bg-linear-to-t from-charcoal via-charcoal/40 to-transparent opacity-60 transition-opacity group-hover:opacity-80" />
        </motion.div>

        {/* Content */}
        <motion.div
          className="absolute right-0 bottom-0 left-0 p-8"
          style={{ y }}
        >
          <p className="mb-2 text-foreground/60 text-sm uppercase tracking-widest">
            {localized(project.subtitle)}
          </p>
          <h3 className="mb-4 font-light text-4xl text-cream md:text-5xl">
            {localized(project.title)}
          </h3>
          <div className="flex items-center gap-2 text-cream/80 text-sm uppercase tracking-widest transition-colors group-hover:text-foreground">
            <span>{t("viewProject")}</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
}

function CurationGridCard({
  project,
  isSelected,
}: {
  project: Doc<"projects">;
  isSelected: boolean;
}) {
  const localized = useLocalized();
  const { setSelectionOverride, clearSelectionOverride, getSelectionOverride } =
    useDraftBufferOps();
  useEditVersion();
  const coverSrc = project.coverImageUrl || "/images/placeholder.svg";

  const override = getSelectionOverride(project._id);
  const effectiveSelected = override ?? isSelected;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: project._id });

  const wasDraggingRef = useRef(false);
  useEffect(() => {
    if (isDragging) {
      wasDraggingRef.current = true;
    }
  }, [isDragging]);

  const handleClick = (e: React.MouseEvent) => {
    if (wasDraggingRef.current) {
      wasDraggingRef.current = false;
      return;
    }
    e.preventDefault();
    const target = !effectiveSelected;
    if (target === isSelected) {
      clearSelectionOverride(project._id);
    } else {
      setSelectionOverride(project._id, target);
    }
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <motion.div
      animate={{
        scale: 1,
        filter: effectiveSelected ? "grayscale(0)" : "grayscale(1)",
      }}
      className={`group relative cursor-pointer ${isDragging ? "opacity-30" : ""} ${isDragging || effectiveSelected ? "" : "opacity-60"}`}
      data-selected={effectiveSelected}
      data-testid="curation-card"
      initial={false}
      onClick={handleClick}
      ref={setNodeRef}
      style={style}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      whileTap={{ scale: 0.97 }}
      {...attributes}
      {...listeners}
    >
      <div
        className={`relative aspect-4/5 overflow-hidden rounded-lg transition-shadow ${
          effectiveSelected
            ? "shadow-[0_0_20px_4px] shadow-foreground/15 ring-2 ring-foreground/20"
            : ""
        }`}
      >
        <Image
          alt={localized(project.title)}
          className="object-cover"
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          src={coverSrc}
        />
        <AnimatePresence>
          {effectiveSelected && (
            <motion.div
              animate={{ scale: 1, opacity: 1 }}
              className="absolute top-3 left-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground"
              data-testid="selection-star"
              exit={{ scale: 0, opacity: 0 }}
              initial={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 25 }}
            >
              <Star className="h-4 w-4 fill-current" />
            </motion.div>
          )}
        </AnimatePresence>
        <div
          className="absolute top-3 right-3 z-10 flex h-8 w-8 cursor-grab items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100"
          data-testid="drag-handle"
        >
          <GripVertical className="h-4 w-4" />
        </div>
      </div>
      <h3 className="mt-3 font-light text-foreground text-lg">
        {localized(project.title)}
      </h3>
    </motion.div>
  );
}

export function SelectedWorks() {
  return (
    <Section label="Selected Works" name="home.selectedWorks">
      <ChromeEnablerProvider>
        <SelectedWorksContent />
      </ChromeEnablerProvider>
    </Section>
  );
}

function useSelectedWorks() {
  const { isEditMode } = useEditMode();
  const { isAuthenticated } = useConvexAuth();

  const publishedWorks = useQuery(api.selectedWorks.listPublished);
  const publishedProjects = useQuery(
    api.projects.listPublished,
    isEditMode ? {} : "skip"
  );

  const adminSelectedWorks = useQuery(
    api.selectedWorks.list,
    isEditMode && isAuthenticated ? {} : "skip"
  );
  const allProjects = useQuery(
    api.projects.list,
    isEditMode && isAuthenticated ? {} : "skip"
  );

  const selectedWorkIds = useMemo(
    () => new Set(adminSelectedWorks?.map((sw) => sw.projectId)),
    [adminSelectedWorks]
  );

  const featured = useMemo(() => {
    if (isEditMode && adminSelectedWorks && allProjects) {
      const projectMap = new Map(allProjects.map((p) => [p._id, p]));
      return adminSelectedWorks
        .map((sw) => projectMap.get(sw.projectId))
        .filter((p): p is Doc<"projects"> => p != null);
    }
    return publishedWorks ?? [];
  }, [isEditMode, adminSelectedWorks, allProjects, publishedWorks]);

  const gridProjects = useMemo(() => {
    if (allProjects && adminSelectedWorks) {
      const selected = adminSelectedWorks
        .map((sw) => allProjects.find((p) => p._id === sw.projectId))
        .filter((p): p is Doc<"projects"> => p != null);
      const unselected = allProjects.filter((p) => !selectedWorkIds.has(p._id));
      return [...selected, ...unselected];
    }
    return publishedProjects ?? publishedWorks ?? [];
  }, [
    allProjects,
    adminSelectedWorks,
    selectedWorkIds,
    publishedProjects,
    publishedWorks,
  ]);

  return { featured, gridProjects, selectedWorkIds };
}

function SelectedWorksContent() {
  const containerRef = useRef<HTMLDivElement>(null);
  const t = useTranslations("common");
  const { isEditMode } = useEditMode();
  const { enable } = useChromeEnabler();
  const { featured, gridProjects, selectedWorkIds } = useSelectedWorks();
  const { setReorderList, getReorderList } = useDraftBufferOps();
  useEditVersion();
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isGridMode, setIsGridMode] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const reorderList = getReorderList("selectedWork");
  const displayGridProjects = useMemo(() => {
    if (!reorderList) {
      return gridProjects;
    }
    return reorderList
      .map((id) => gridProjects.find((p) => p._id === id))
      .filter((p): p is Doc<"projects"> => p !== undefined)
      .concat(gridProjects.filter((p) => !reorderList.includes(p._id)));
  }, [reorderList, gridProjects]);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveId(null);
      const { active, over } = event;
      if (!over || active.id === over.id) {
        return;
      }
      const oldIndex = displayGridProjects.findIndex(
        (p) => p._id === active.id
      );
      const newIndex = displayGridProjects.findIndex((p) => p._id === over.id);
      if (oldIndex === -1 || newIndex === -1) {
        return;
      }
      const reordered = [...displayGridProjects];
      const [moved] = reordered.splice(oldIndex, 1);
      reordered.splice(newIndex, 0, moved);
      setReorderList(
        "selectedWork",
        reordered.map((p) => p._id)
      );
    },
    [displayGridProjects, setReorderList]
  );

  const updateScrollState = useCallback(() => {
    const el = containerRef.current;
    if (!el) {
      return;
    }
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  }, []);

  const scroll = useCallback(
    (direction: "left" | "right") => {
      const el = containerRef.current;
      if (!el) {
        return;
      }
      const cardWidth =
        el.querySelector<HTMLElement>("[data-card]")?.offsetWidth ??
        el.clientWidth * 0.8;
      el.scrollBy({
        left: direction === "left" ? -cardWidth - 24 : cardWidth + 24,
        behavior: "smooth",
      });
      setTimeout(updateScrollState, 400);
    },
    [updateScrollState]
  );

  return (
    <CollapsibleSection visible={featured.length > 0 || isEditMode}>
      <section className="relative bg-background py-32">
        {/* Section Header */}
        <div className="mx-auto mb-16 max-w-7xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            onAnimationComplete={enable}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <Field
              as="p"
              className="mb-4 text-foreground/60 text-sm uppercase tracking-widest"
              name="label"
            />
            <div className="flex items-end justify-between">
              <Field as="h2" className="text-foreground" name="title" />
              <div className="hidden items-center gap-4 md:flex">
                {isEditMode && (
                  <button
                    aria-label={
                      isGridMode ? "Close grid" : "Open curation grid"
                    }
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-foreground/20 text-foreground/60 transition-all hover:border-foreground hover:text-foreground"
                    data-testid="grid-mode-toggle"
                    onClick={() => setIsGridMode((v) => !v)}
                    type="button"
                  >
                    {isGridMode ? (
                      <X className="h-5 w-5" />
                    ) : (
                      <LayoutGrid className="h-5 w-5" />
                    )}
                  </button>
                )}
                <AnimatePresence initial={false}>
                  {!isGridMode && (
                    <motion.div
                      animate={{ opacity: 1, width: "auto" }}
                      className="flex gap-2 overflow-hidden"
                      exit={{ opacity: 0, width: 0 }}
                      initial={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                    >
                      <button
                        aria-label="Previous project"
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-foreground/20 text-foreground/60 transition-all hover:border-foreground hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
                        disabled={!canScrollLeft}
                        onClick={() => scroll("left")}
                        type="button"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button
                        aria-label="Next project"
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-foreground/20 text-foreground/60 transition-all hover:border-foreground hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
                        disabled={!canScrollRight}
                        onClick={() => scroll("right")}
                        type="button"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
                <Link
                  className="flex items-center gap-2 text-foreground/60 text-sm uppercase tracking-widest transition-colors hover:text-foreground"
                  href="/vision"
                >
                  <span>{t("viewAll")}</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </motion.div>
        </div>

        <AnimatePresence mode="wait">
          {isGridMode ? (
            <motion.div
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              initial={{ opacity: 0 }}
              key="curation-grid"
              transition={{ duration: 0.3 }}
            >
              <DndContext
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
                onDragStart={handleDragStart}
                sensors={sensors}
              >
                <SortableContext
                  items={displayGridProjects.map((p) => p._id)}
                  strategy={rectSortingStrategy}
                >
                  <div
                    className="mx-auto grid max-w-7xl gap-8 px-6 sm:grid-cols-2 lg:grid-cols-3"
                    data-testid="curation-grid"
                  >
                    {displayGridProjects.map((project) => (
                      <CurationGridCard
                        isSelected={selectedWorkIds.has(project._id)}
                        key={project._id}
                        project={project}
                      />
                    ))}
                  </div>
                </SortableContext>
                <DragOverlay>
                  {activeId
                    ? (() => {
                        const project = displayGridProjects.find(
                          (p) => p._id === activeId
                        );
                        if (!project) {
                          return null;
                        }
                        const coverSrc =
                          project.coverImageUrl || "/images/placeholder.svg";
                        return (
                          <div className="w-full cursor-grabbing">
                            <div className="relative aspect-4/5 overflow-hidden rounded-lg shadow-2xl ring-2 ring-foreground/20">
                              <Image
                                alt=""
                                className="object-cover"
                                fill
                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                src={coverSrc}
                              />
                            </div>
                          </div>
                        );
                      })()
                    : null}
                </DragOverlay>
              </DndContext>
            </motion.div>
          ) : (
            <motion.div
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              initial={{ opacity: 0 }}
              key="carousel"
              transition={{ duration: 0.3 }}
            >
              <div
                className="scrollbar-hide flex snap-x snap-mandatory gap-6 overflow-x-auto px-6 pb-8"
                data-testid="selected-works-carousel"
                onScroll={updateScrollState}
                ref={containerRef}
                style={{
                  scrollbarWidth: "none",
                  msOverflowStyle: "none",
                }}
              >
                <div className="min-w-[5vw] shrink-0 md:min-w-[10vw]" />
                {featured.map((project, index) => (
                  <SelectedWorkCard
                    index={index}
                    key={project._id}
                    project={project}
                  />
                ))}
                <div className="min-w-[5vw] shrink-0 md:min-w-[10vw]" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile View All Link */}
        <div className="mt-8 text-center md:hidden">
          <Link
            className="inline-flex items-center gap-2 text-foreground/60 text-sm uppercase tracking-widest transition-colors hover:text-foreground"
            href="/vision"
          >
            <span>{t("viewAllProjects")}</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Subscribe */}
        <div className="mx-auto mt-16 max-w-md px-6">
          <SubscribeForm sectionName="home.subscribe" />
        </div>
      </section>
    </CollapsibleSection>
  );
}
