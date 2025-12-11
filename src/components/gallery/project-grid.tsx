"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { fadeUp, staggerContainer } from "@/lib/animations";

export type Project = {
  slug: string;
  title: string;
  description: string;
  coverImage: string;
  category: string;
  imageCount: number;
};

type ProjectGridProps = {
  projects: Project[];
};

function ProjectCard({ project, index }: { project: Project; index: number }) {
  return (
    <motion.div className="group relative" custom={index} variants={fadeUp}>
      <Link
        className="block overflow-hidden rounded-lg"
        href={`/vision/${project.slug}`}
      >
        {/* Image Container */}
        <div className="relative aspect-4/5 overflow-hidden">
          <Image
            alt={project.title}
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            src={project.coverImage}
          />
          {/* Overlay */}
          <div className="absolute inset-0 bg-linear-to-t from-background/80 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

          {/* Hover Content */}
          <div className="absolute right-0 bottom-0 left-0 translate-y-4 p-6 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
            <p className="mb-2 text-cream/60 text-xs uppercase tracking-widest">
              {project.category}
            </p>
            <h3 className="font-light text-2xl text-cream">{project.title}</h3>
            <p className="mt-2 text-cream/70 text-sm">
              {project.imageCount} photographs
            </p>
          </div>
        </div>

        {/* Static Content (visible by default) */}
        <div className="mt-4 transition-opacity duration-500 group-hover:opacity-0">
          <p className="mb-1 text-muted-foreground text-xs uppercase tracking-widest">
            {project.category}
          </p>
          <h3 className="font-light text-cream text-xl">{project.title}</h3>
        </div>
      </Link>
    </motion.div>
  );
}

export function ProjectGrid({ projects }: ProjectGridProps) {
  return (
    <motion.div
      animate="visible"
      className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3"
      initial="hidden"
      variants={staggerContainer}
    >
      {projects.map((project, index) => (
        <ProjectCard index={index} key={project.slug} project={project} />
      ))}
    </motion.div>
  );
}
