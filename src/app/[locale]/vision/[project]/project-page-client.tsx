"use client";

import { api } from "convex/_generated/api";
import { useMutation } from "convex/react";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { notFound, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useEditMode } from "@/components/admin/edit-mode-context";
import { EditableImageGrid } from "@/components/admin/editable-image-grid";
import { EditableText } from "@/components/admin/editable-text";
import { CursorFollower } from "@/components/gallery/cursor-follower";
import { ImageGrid } from "@/components/gallery/image-grid";
import { ImageModal } from "@/components/gallery/image-modal";
import { PageTransition } from "@/components/layout/page-transition";
import { Link } from "@/i18n/routing";
import { useLocalized, useProject, useProjectImages } from "@/lib/hooks";

export function ProjectPageClient() {
  const { project: slug } = useParams<{ project: string }>();
  const { project, isLoading: projectLoading } = useProject(slug);
  const { images: rawImages, isLoading: imagesLoading } = useProjectImages(
    project?._id
  );
  const { isEditMode } = useEditMode();
  const updateProject = useMutation(api.projects.update);

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
          <div className="mb-16 max-w-3xl">
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              initial={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <EditableText
                as="p"
                className="mb-4 text-foreground/60 text-sm uppercase tracking-widest"
                onChange={(v) =>
                  updateProject({ id: project._id, category: v })
                }
                placeholder="Enter category..."
                value={project.category}
              />
            </motion.div>
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              initial={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <EditableText
                as="h1"
                className="mb-6 text-foreground"
                onChange={(v) => updateProject({ id: project._id, title: v })}
                placeholder="Enter title..."
                value={project.title}
              />
            </motion.div>
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              initial={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <EditableText
                as="p"
                className="text-lg text-muted-foreground"
                multiline
                onChange={(v) =>
                  updateProject({ id: project._id, description: v })
                }
                placeholder="Enter description..."
                value={project.description}
              />
            </motion.div>
            <motion.p
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 text-muted-foreground text-sm"
              initial={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              {t("photographs", { count: images.length })}
            </motion.p>
          </div>

          {/* Image Grid — edit mode shows sortable grid with upload */}
          {isEditMode ? (
            <EditableImageGrid
              images={rawImages}
              projectId={project._id}
              projectSlug={slug}
            />
          ) : null}

          {/* Image Grid — public view */}
          {!isEditMode && images.length > 0 ? (
            <ImageGrid
              images={images}
              onHoverChange={setIsHoveringImage}
              onImageClick={handleImageClick}
            />
          ) : null}

          {!isEditMode && images.length === 0 ? (
            <p className="text-center text-muted-foreground">
              No photographs yet.
            </p>
          ) : null}
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
