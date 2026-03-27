"use client";

import { useTranslations } from "next-intl";
import { ProjectGrid } from "@/components/gallery/project-grid";
import { PageTransition } from "@/components/layout/page-transition";
import { useProjects } from "@/lib/hooks";

export function VisionClient() {
  const t = useTranslations("vision");
  const { projects } = useProjects();

  return (
    <PageTransition>
      <div className="min-h-screen pt-32 pb-20">
        <div className="mx-auto max-w-7xl px-6">
          {/* Header */}
          <div className="mb-16 max-w-3xl">
            <p className="mb-4 text-foreground/60 text-sm uppercase tracking-widest">
              {t("label")}
            </p>
            <h1 className="mb-6 text-foreground">{t("title")}</h1>
            <p className="text-lg text-muted-foreground">{t("description")}</p>
          </div>

          {/* Projects Grid */}
          <ProjectGrid projects={projects} />
        </div>
      </div>
    </PageTransition>
  );
}
