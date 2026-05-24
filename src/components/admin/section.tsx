"use client";

import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import { useQuery } from "convex/react";
import type { ReactNode } from "react";
import { createContext, useContext, useEffect } from "react";
import { useDraftBufferOps } from "./draft-buffer-context";
import { usePageBoundaryRegistration } from "./page-boundary";
import { routeSection } from "./save-routing";

interface SectionContextValue {
  data: Record<string, { en: string; it: string }> | undefined;
  label?: string;
  name: string;
}

const SectionContext = createContext<SectionContextValue>({
  name: "",
  data: undefined,
});

export function Section({
  name,
  label,
  children,
}: {
  children: ReactNode;
  label?: string;
  name: string;
}) {
  const route = routeSection(name);

  const siteContent = useQuery(
    api.siteContent.getBySection,
    route.kind === "siteContent" ? { section: name } : "skip"
  );
  const project = useQuery(
    api.projects.getById,
    route.kind === "project" ? { id: route.id as Id<"projects"> } : "skip"
  );
  const post = useQuery(
    api.blogPosts.getById,
    route.kind === "post" ? { id: route.id as Id<"blogPosts"> } : "skip"
  );
  const achievement = useQuery(
    api.achievements.getById,
    route.kind === "achievement"
      ? { id: route.id as Id<"achievements"> }
      : "skip"
  );

  usePageBoundaryRegistration(name, label ?? name);
  const { registerSectionData } = useDraftBufferOps();

  let data: Record<string, { en: string; it: string }> | undefined;

  if (route.kind === "siteContent") {
    data = siteContent?.content;
  } else if (route.kind === "project" && project) {
    data = {
      title: project.title,
      subtitle: project.subtitle,
      description: project.description,
      tagline: project.tagline,
    };
  } else if (route.kind === "post" && post) {
    data = {
      title: post.title,
      excerpt: post.excerpt,
    };
  } else if (route.kind === "achievement" && achievement) {
    const yearStr = String(achievement.startYear);
    const endYearStr =
      achievement.endYear == null ? "" : String(achievement.endYear);
    data = {
      startYear: { en: yearStr, it: yearStr },
      endYear: { en: endYearStr, it: endYearStr },
      title: achievement.title,
      description: achievement.description,
    };
  }

  useEffect(() => {
    if (data) {
      registerSectionData(name, data);
    }
  }, [name, data, registerSectionData]);

  return (
    <SectionContext value={{ name, data, label }}>{children}</SectionContext>
  );
}

export function useSection() {
  return useContext(SectionContext);
}
