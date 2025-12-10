import type { Metadata } from "next";
import { ProjectGrid } from "@/components/gallery/project-grid";
import { PageTransition } from "@/components/layout/page-transition";
import { projects } from "@/lib/projects";

export const metadata: Metadata = {
  title: "Vision",
  description:
    "Explore the photography portfolio of Ginevra Renier. A curated collection of portraits, landscapes, urban scenes, and abstract works.",
};

export default function VisionPage() {
  return (
    <PageTransition>
      <div className="min-h-screen pt-32 pb-20">
        <div className="mx-auto max-w-7xl px-6">
          {/* Header */}
          <div className="mb-16 max-w-3xl">
            <p className="mb-4 text-cream/60 text-sm uppercase tracking-widest">
              Portfolio
            </p>
            <h1 className="mb-6 text-cream">Vision</h1>
            <p className="text-lg text-muted-foreground">
              A curated collection of works spanning portraits, landscapes,
              urban explorations, and abstract expressions. Each project is a
              chapter in an ongoing visual narrative.
            </p>
          </div>

          {/* Projects Grid */}
          <ProjectGrid projects={projects} />
        </div>
      </div>
    </PageTransition>
  );
}
