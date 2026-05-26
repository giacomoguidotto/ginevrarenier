"use client";

import { api } from "convex/_generated/api";
import type { Doc } from "convex/_generated/dataModel";
import { useConvexAuth, useQuery } from "convex/react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  ChromeEnablerProvider,
  useChromeEnabler,
} from "@/components/admin/chrome-enabler";
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

  const publishedWorks = useQuery(
    api.selectedWorks.listPublished,
    isEditMode ? "skip" : {}
  );

  const adminSelectedWorks = useQuery(
    api.selectedWorks.list,
    isEditMode && isAuthenticated ? {} : "skip"
  );
  const allProjects = useQuery(
    api.projects.list,
    isEditMode && isAuthenticated ? {} : "skip"
  );

  return useMemo(() => {
    if (isEditMode && adminSelectedWorks && allProjects) {
      const projectMap = new Map(allProjects.map((p) => [p._id, p]));
      return adminSelectedWorks
        .map((sw) => projectMap.get(sw.projectId))
        .filter((p): p is Doc<"projects"> => p != null);
    }
    return publishedWorks ?? [];
  }, [isEditMode, adminSelectedWorks, allProjects, publishedWorks]);
}

function SelectedWorksContent() {
  const containerRef = useRef<HTMLDivElement>(null);
  const t = useTranslations("common");
  const { isEditMode } = useEditMode();
  const { enable } = useChromeEnabler();
  const featured = useSelectedWorks();
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

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
                <div className="flex gap-2">
                  <button
                    aria-label="Previous project"
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-foreground/20 text-foreground/60 transition-all hover:border-foreground hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
                    disabled={!canScrollLeft}
                    onClick={() => scroll("left")}
                    type="button"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    aria-label="Next project"
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-foreground/20 text-foreground/60 transition-all hover:border-foreground hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
                    disabled={!canScrollRight}
                    onClick={() => scroll("right")}
                    type="button"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
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

        {/* Horizontal Scroll Container */}
        <div
          className="scrollbar-hide flex snap-x snap-mandatory gap-6 overflow-x-auto px-6 pb-8"
          onScroll={updateScrollState}
          ref={containerRef}
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {/* Spacer for centering first item */}
          <div className="min-w-[5vw] shrink-0 md:min-w-[10vw]" />

          {featured.map((project, index) => (
            <SelectedWorkCard
              index={index}
              key={project._id}
              project={project}
            />
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

        {/* Subscribe */}
        <div className="mx-auto mt-16 max-w-md px-6">
          <SubscribeForm sectionName="home.subscribe" />
        </div>
      </section>
    </CollapsibleSection>
  );
}
