"use client";

import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import { useQuery } from "convex/react";
import type { ReactNode } from "react";
import { createContext, useContext } from "react";
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

  usePageBoundaryRegistration(name, label ?? name);

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
  }

  return (
    <SectionContext value={{ name, data, label }}>{children}</SectionContext>
  );
}

export function useSection() {
  return useContext(SectionContext);
}
