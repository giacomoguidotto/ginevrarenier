"use client";

import type { Doc } from "convex/_generated/dataModel";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useRef } from "react";
import { Field } from "@/components/admin/field";
import { Section } from "@/components/admin/section";
import { Link } from "@/i18n/routing";
import { useLocalized, useProjects } from "@/lib/hooks";

function ProjectCard({
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

export function FeaturedWork() {
  const containerRef = useRef<HTMLDivElement>(null);
  const t = useTranslations("common");
  const { projects } = useProjects();

  const featured = projects.slice(0, 5);

  return (
    <Section name="home.featured">
      <section className="relative bg-background py-32">
        {/* Section Header */}
        <div className="mx-auto mb-16 max-w-7xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
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
              <Link
                className="hidden items-center gap-2 text-foreground/60 text-sm uppercase tracking-widest transition-colors hover:text-foreground md:flex"
                href="/vision"
              >
                <span>{t("viewAll")}</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Horizontal Scroll Container */}
        <div
          className="scrollbar-hide flex snap-x snap-mandatory gap-6 overflow-x-auto px-6 pb-8"
          ref={containerRef}
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {/* Spacer for centering first item */}
          <div className="min-w-[5vw] shrink-0 md:min-w-[10vw]" />

          {featured.map((project, index) => (
            <ProjectCard index={index} key={project._id} project={project} />
          ))}

          {/* Spacer for centering last item */}
          <div className="min-w-[5vw] shrink-0 md:min-w-[10vw]" />
        </div>

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
      </section>
    </Section>
  );
}
