"use client";

import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import { useConvexAuth, useQuery } from "convex/react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowUpRight,
  EyeOff,
  Star,
  Trash2,
  Undo2,
} from "lucide-react";
import { notFound, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import {
  ChromeEnablerProvider,
  useChromeEnabler,
} from "@/components/admin/chrome-enabler";
import {
  useDraftBufferOps,
  useEditVersion,
} from "@/components/admin/draft-buffer-context";
import { useEditMode } from "@/components/admin/edit-mode-context";
import { EditableImageGrid } from "@/components/admin/editable-image-grid";
import { Field } from "@/components/admin/field";
import { Section } from "@/components/admin/section";
import { useSlugDerivation } from "@/components/admin/use-slug-derivation";
import { useStableEntity } from "@/components/admin/use-stable-entity";
import { ProjectGalleryEmptyState } from "@/components/empty-states/project-gallery-empty-state";
import { CursorFollower } from "@/components/gallery/cursor-follower";
import { ImageGrid } from "@/components/gallery/image-grid";
import { ImageModal } from "@/components/gallery/image-modal";
import { PageTransition } from "@/components/layout/page-transition";
import { Link, useRouter } from "@/i18n/routing";
import { useLocalized, useProjectImages } from "@/lib/hooks";

export function ProjectPageClient() {
  const { project: slug } = useParams<{ project: string }>();
  const {
    id: projectId,
    entity: project,
    isLoading: projectLoading,
  } = useStableEntity("project", slug);
  const { images: rawImages, isLoading: imagesLoading } = useProjectImages(
    projectId as Id<"projects"> | undefined
  );
  const { isEditMode } = useEditMode();
  const { isAuthenticated } = useConvexAuth();

  const selectedWorks = useQuery(
    api.selectedWorks.list,
    isEditMode && isAuthenticated ? {} : "skip"
  );
  const isSelected =
    selectedWorks?.some((sw) => sw.projectId === projectId) ?? false;

  const t = useTranslations("common");
  const _localized = useLocalized();

  const [modalOpen, setModalOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHoveringImage, setIsHoveringImage] = useState(false);

  if (projectLoading || imagesLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-foreground/20 border-t-foreground" />
      </div>
    );
  }

  if (!project) {
    notFound();
  }

  const images = rawImages.map((img) => ({ url: img.url, id: img._id }));

  const handleImageClick = (index: number) => {
    setCurrentImageIndex(index);
    setModalOpen(true);
  };

  const handlePrevious = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const projectTitle = (project as Record<string, unknown>).title as
    | { en: string; it: string }
    | undefined;

  return (
    <PageTransition>
      <CursorFollower isHoveringImage={isHoveringImage} />

      <div className="min-h-screen pt-32 pb-20">
        <div className="mx-auto max-w-7xl px-6">
          {/* Back Link */}
          <motion.div
            animate={{ opacity: 1, x: 0 }}
            initial={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.5 }}
          >
            <Link
              className="mb-12 inline-flex items-center gap-2 text-muted-foreground text-sm uppercase tracking-widest transition-colors hover:text-foreground"
              href="/vision"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>{t("backTo", { page: "Vision" })}</span>
            </Link>
          </motion.div>

          {/* Project Header */}
          <Section
            label={`Project: ${projectTitle?.en ?? ""}`}
            name={`project:${projectId}`}
          >
            <ChromeEnablerProvider>
              <ProjectHeader
                currentSlug={
                  (project as Record<string, unknown>).slug as
                    | string
                    | undefined
                }
                imageCount={images.length}
                isSelected={isSelected}
                projectId={projectId as string}
                published={
                  (project as Record<string, unknown>).published as boolean
                }
              />
            </ChromeEnablerProvider>
          </Section>

          {/* Image Grid — edit mode shows sortable grid with upload */}
          {isEditMode ? (
            <EditableImageGrid
              images={rawImages}
              projectId={projectId as Id<"projects">}
              projectSlug={slug}
              projectTitle={projectTitle?.en ?? ""}
            />
          ) : null}

          {/* Image Grid — public view */}
          {!isEditMode && images.length > 0 ? (
            <ImageGrid
              images={images}
              onHoverChange={setIsHoveringImage}
              onImageClick={handleImageClick}
              projectTitle={_localized(projectTitle ?? { en: "", it: "" })}
            />
          ) : null}

          {images.length === 0 ? <ProjectGalleryEmptyState /> : null}
        </div>
      </div>

      {/* Lightbox Modal */}
      {images.length > 0 && (
        <ImageModal
          currentIndex={currentImageIndex}
          images={images}
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onNext={handleNext}
          onPrevious={handlePrevious}
        />
      )}
    </PageTransition>
  );
}

export function ProjectHeader({
  currentSlug,
  imageCount,
  isSelected,
  projectId,
  published,
}: {
  currentSlug: string | undefined;
  imageCount: number;
  isSelected: boolean;
  projectId: string;
  published: boolean;
}) {
  const { enable } = useChromeEnabler();
  const { isEditMode } = useEditMode();
  const {
    getPublishOverride,
    setPublishOverride,
    clearPublishOverride,
    getSelectionOverride,
    setSelectionOverride,
    clearSelectionOverride,
    isPendingDeletion,
    trackDeletion,
    cancelDeletion,
  } = useDraftBufferOps();
  useEditVersion();
  useSlugDerivation(`project:${projectId}`, "project", currentSlug);
  const t = useTranslations("common");
  const router = useRouter();

  const publishOverride = getPublishOverride("project", projectId);
  const effectivePublished =
    publishOverride === undefined ? published : publishOverride;

  const selectionOverride = getSelectionOverride(projectId);
  const effectiveSelected =
    selectionOverride === undefined ? isSelected : selectionOverride;

  const handleTogglePublish = () => {
    const target = !effectivePublished;
    if (target === published) {
      clearPublishOverride("project", projectId);
    } else {
      setPublishOverride("project", projectId, target);
    }
  };

  const handleToggleSelect = () => {
    const target = !effectiveSelected;
    if (target === isSelected) {
      clearSelectionOverride(projectId);
    } else {
      setSelectionOverride(projectId, target);
    }
  };

  const pendingDeletion = isPendingDeletion("project", projectId);

  const handleDelete = () => {
    trackDeletion("project", projectId);
    router.push("/vision");
  };

  const handleCancelDeletion = () => {
    cancelDeletion("project", projectId);
  };

  return (
    <div className="mb-16 max-w-3xl">
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        initial={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Field
          as="p"
          className="mb-4 text-foreground/60 text-sm uppercase tracking-widest"
          name="tagline"
        />
      </motion.div>
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        initial={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Field as="h1" className="mb-6 text-foreground" name="title" />
      </motion.div>
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        initial={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Field
          as="p"
          className="text-lg text-muted-foreground"
          multiline
          name="description"
        />
      </motion.div>
      <motion.p
        animate={{ opacity: 1, y: 0 }}
        className="mt-4 text-muted-foreground text-sm"
        initial={{ opacity: 0, y: 20 }}
        onAnimationComplete={enable}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        {t("photographs", { count: imageCount })}
      </motion.p>
      {isEditMode && (
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 flex items-center gap-3"
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          {pendingDeletion ? (
            <button
              className="inline-flex items-center gap-2 rounded-full bg-destructive/90 px-6 py-2.5 font-medium text-sm text-white uppercase tracking-widest transition-all hover:bg-destructive hover:shadow-md"
              data-testid="header-cancel-deletion-button"
              onClick={handleCancelDeletion}
              type="button"
            >
              <Undo2 className="h-4 w-4" />
              Cancel deletion
            </button>
          ) : (
            <>
              {effectiveSelected ? (
                <button
                  className="inline-flex items-center gap-2 rounded-full bg-foreground/20 px-6 py-2.5 font-medium text-foreground text-sm uppercase tracking-widest transition-all hover:bg-foreground/30 hover:shadow-md"
                  data-testid="header-unselect-button"
                  onClick={handleToggleSelect}
                  type="button"
                >
                  <Star className="h-4 w-4 fill-current" />
                  Unselect
                </button>
              ) : (
                <button
                  className="inline-flex items-center gap-2 rounded-full bg-foreground/20 px-6 py-2.5 font-medium text-foreground text-sm uppercase tracking-widest transition-all hover:bg-foreground/30 hover:shadow-md"
                  data-testid="header-select-button"
                  onClick={handleToggleSelect}
                  type="button"
                >
                  <Star className="h-4 w-4" />
                  Select
                </button>
              )}

              {effectivePublished ? (
                <button
                  className="inline-flex items-center gap-2 rounded-full bg-foreground/20 px-6 py-2.5 font-medium text-foreground text-sm uppercase tracking-widest transition-all hover:bg-foreground/30 hover:shadow-md"
                  data-testid="header-unpublish-button"
                  onClick={handleTogglePublish}
                  type="button"
                >
                  <EyeOff className="h-4 w-4" />
                  Unpublish
                </button>
              ) : (
                <button
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 font-medium text-primary-foreground text-sm uppercase tracking-widest transition-all hover:bg-primary/90 hover:shadow-md"
                  data-testid="header-publish-button"
                  onClick={handleTogglePublish}
                  type="button"
                >
                  <ArrowUpRight className="h-4 w-4" />
                  Publish
                </button>
              )}

              <button
                className="inline-flex items-center gap-2 rounded-full bg-destructive/80 px-6 py-2.5 font-medium text-sm text-white uppercase tracking-widest transition-all hover:bg-destructive hover:shadow-md"
                data-testid="header-delete-button"
                onClick={handleDelete}
                type="button"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </>
          )}
        </motion.div>
      )}
    </div>
  );
}
