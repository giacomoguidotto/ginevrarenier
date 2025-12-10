"use client";

import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { useState } from "react";
import { CursorFollower } from "@/components/gallery/cursor-follower";
import { ImageGrid } from "@/components/gallery/image-grid";
import { ImageModal } from "@/components/gallery/image-modal";
import { PageTransition } from "@/components/layout/page-transition";
import { getProject, getProjectImages } from "@/lib/projects";

export default function ProjectPage() {
  const params = useParams();
  const slug = params.project as string;
  const project = getProject(slug);
  const images = getProjectImages(slug);

  const [modalOpen, setModalOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHoveringImage, setIsHoveringImage] = useState(false);

  if (!project) {
    notFound();
  }

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
              className="mb-12 inline-flex items-center gap-2 text-muted-foreground text-sm uppercase tracking-widest transition-colors hover:text-cream"
              href="/vision"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Vision</span>
            </Link>
          </motion.div>

          {/* Project Header */}
          <div className="mb-16 max-w-3xl">
            <motion.p
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 text-cream/60 text-sm uppercase tracking-widest"
              initial={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              {project.category}
            </motion.p>
            <motion.h1
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 text-cream"
              initial={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {project.title}
            </motion.h1>
            <motion.p
              animate={{ opacity: 1, y: 0 }}
              className="text-lg text-muted-foreground"
              initial={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              {project.description}
            </motion.p>
            <motion.p
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 text-muted-foreground text-sm"
              initial={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              {project.imageCount} photographs
            </motion.p>
          </div>

          {/* Image Grid */}
          <ImageGrid
            images={images}
            onHoverChange={setIsHoveringImage}
            onImageClick={handleImageClick}
            projectSlug={slug}
          />
        </div>
      </div>

      {/* Lightbox Modal */}
      <ImageModal
        currentIndex={currentImageIndex}
        images={images}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onNext={handleNext}
        onPrevious={handlePrevious}
        projectSlug={slug}
      />
    </PageTransition>
  );
}
