"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { fadeUp, staggerContainer } from "@/lib/animations";

type ImageGridProps = {
  images: string[];
  projectSlug: string;
  onImageClick: (index: number) => void;
  onHoverChange?: (isHovering: boolean) => void;
};

export function ImageGrid({
  images,
  projectSlug,
  onImageClick,
  onHoverChange,
}: ImageGridProps) {
  return (
    <motion.div
      animate="visible"
      className="columns-1 gap-4 space-y-4 sm:columns-2 lg:columns-3"
      initial="hidden"
      onMouseEnter={() => onHoverChange?.(true)}
      onMouseLeave={() => onHoverChange?.(false)}
      variants={staggerContainer}
    >
      {images.map((image, index) => (
        <motion.div
          className="group relative cursor-pointer break-inside-avoid overflow-hidden rounded-lg"
          key={image}
          onClick={() => onImageClick(index)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              onImageClick(index);
            }
          }}
          role="button"
          tabIndex={0}
          variants={fadeUp}
        >
          <div className="relative aspect-auto">
            <Image
              alt={`${projectSlug} photograph ${index + 1}`}
              className="w-full transition-transform duration-700 group-hover:scale-105"
              height={1200}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              src={`/images/projects/${projectSlug}/${image}`}
              width={800}
            />
            {/* Hover Overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-background/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border border-cream/50 bg-background/50 backdrop-blur-sm">
                <svg
                  aria-hidden="true"
                  className="h-6 w-6 text-cream"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                  />
                </svg>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
