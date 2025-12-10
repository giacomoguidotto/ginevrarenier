"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect } from "react";

type ImageModalProps = {
  images: string[];
  projectSlug: string;
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onPrevious: () => void;
  onNext: () => void;
};

export function ImageModal({
  images,
  projectSlug,
  currentIndex,
  isOpen,
  onClose,
  onPrevious,
  onNext,
}: ImageModalProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft") {
        onPrevious();
      } else if (e.key === "ArrowRight") {
        onNext();
      }
    },
    [onClose, onPrevious, onNext]
  );

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Backdrop */}
          <motion.div
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-background/95 backdrop-blur-md"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Close Button */}
          <button
            aria-label="Close modal"
            className="absolute top-6 right-6 z-10 flex h-12 w-12 items-center justify-center rounded-full border border-cream/20 bg-background/50 text-cream transition-colors hover:border-cream hover:bg-background"
            onClick={onClose}
            type="button"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Navigation Buttons */}
          <button
            aria-label="Previous image"
            className="absolute left-4 z-10 flex h-12 w-12 items-center justify-center rounded-full border border-cream/20 bg-background/50 text-cream transition-colors hover:border-cream hover:bg-background md:left-8"
            onClick={onPrevious}
            type="button"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          <button
            aria-label="Next image"
            className="absolute right-4 z-10 flex h-12 w-12 items-center justify-center rounded-full border border-cream/20 bg-background/50 text-cream transition-colors hover:border-cream hover:bg-background md:right-8"
            onClick={onNext}
            type="button"
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          {/* Image */}
          <motion.div
            animate={{ opacity: 1, scale: 1 }}
            className="relative h-[80vh] w-[90vw] max-w-6xl"
            exit={{ opacity: 0, scale: 0.95 }}
            initial={{ opacity: 0, scale: 0.95 }}
            key={currentIndex}
            transition={{ duration: 0.3 }}
          >
            <Image
              alt={`${projectSlug} photograph ${currentIndex + 1}`}
              className="object-contain"
              fill
              priority
              sizes="90vw"
              src={`/images/projects/${projectSlug}/${images[currentIndex]}`}
            />
          </motion.div>

          {/* Counter */}
          <div className="-translate-x-1/2 absolute bottom-6 left-1/2 text-muted-foreground text-sm">
            {currentIndex + 1} / {images.length}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
