"use client";

import type { Doc } from "convex/_generated/dataModel";
import { motion } from "framer-motion";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { fadeUp, staggerContainer } from "@/lib/animations";
import { useLocalized } from "@/lib/hooks";

type Project = Doc<"projects">;

function ProjectCard({
  project,
  index,
  imageCount,
}: {
  project: Project;
  index: number;
  imageCount?: number;
}) {
  const t = useTranslations("common");
  const localized = useLocalized();

  const coverSrc = project.coverImageUrl || "/images/placeholder.svg";

  return (
    <motion.div className="group relative" custom={index} variants={fadeUp}>
      <Link
        className="block overflow-hidden rounded-lg"
        href={`/vision/${project.slug}`}
      >
        {/* Image Container */}
        <div className="relative z-[1] aspect-4/5 overflow-hidden">
          <Image
            alt={localized(project.title)}
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            src={coverSrc}
          />
          {/* Overlay - always dark for consistent text contrast */}
          <div className="absolute inset-0 bg-linear-to-t from-charcoal/90 via-charcoal/20 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

          {/* Hover Content */}
          <div className="absolute right-0 bottom-0 left-0 translate-y-4 p-6 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
            <p className="mb-2 text-cream/60 text-xs uppercase tracking-widest">
              {localized(project.category)}
            </p>
            <h3 className="font-light text-2xl text-cream">
              {localized(project.title)}
            </h3>
            {imageCount !== undefined && (
              <p className="mt-2 text-cream/70 text-sm">
                {t("photographs", { count: imageCount })}
              </p>
            )}
          </div>
        </div>

        {/* Static Content (visible by default) */}
        <div className="mt-4 transition-opacity duration-500 group-hover:opacity-0">
          <p className="mb-1 text-muted-foreground text-xs uppercase tracking-widest">
            {localized(project.category)}
          </p>
          <h3 className="font-light text-foreground text-xl">
            {localized(project.title)}
          </h3>
        </div>
      </Link>
    </motion.div>
  );
}

export function ProjectGrid({ projects }: { projects: Project[] }) {
  return (
    <motion.div
      animate="visible"
      className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3"
      initial="hidden"
      variants={staggerContainer}
    >
      {projects.map((project, index) => (
        <ProjectCard index={index} key={project._id} project={project} />
      ))}
    </motion.div>
  );
}
