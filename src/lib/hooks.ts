"use client";

import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { useLocale } from "next-intl";
import type { Locale } from "@/i18n/config";

/**
 * Hook to get a localized field value from a bilingual object.
 */
export function useLocalized() {
  const locale = useLocale() as Locale;
  return function localized(field: { en: string; it: string } | undefined) {
    if (!field) {
      return "";
    }
    return field[locale] || field.en;
  };
}

/**
 * Hook to fetch and localize a site content section from Convex.
 * Returns a function to access fields by key.
 */
export function useSiteContent(section: string) {
  const locale = useLocale() as Locale;
  const data = useQuery(api.siteContent.getBySection, { section });

  function t(key: string): string {
    if (!data?.content) {
      return "";
    }
    const field = data.content[key];
    if (!field) {
      return "";
    }
    return field[locale] || field.en;
  }

  return { t, isLoading: data === undefined };
}

/**
 * Hook to fetch all published projects from Convex.
 */
export function useProjects() {
  const projects = useQuery(api.projects.listPublished);
  return { projects: projects ?? [], isLoading: projects === undefined };
}

/**
 * Hook to fetch a single project by slug.
 */
export function useProject(slug: string) {
  const project = useQuery(api.projects.getBySlug, { slug });
  return { project: project ?? null, isLoading: project === undefined };
}

/**
 * Hook to fetch images for a project.
 */
export function useProjectImages(projectId: Id<"projects"> | undefined) {
  const images = useQuery(
    api.projectImages.listByProject,
    projectId ? { projectId } : "skip"
  );
  return { images: images ?? [], isLoading: images === undefined };
}

/**
 * Hook to fetch all published blog posts.
 */
export function usePublishedBlogPosts() {
  const posts = useQuery(api.blogPosts.listPublished);
  return { posts: posts ?? [], isLoading: posts === undefined };
}

/**
 * Hook to fetch a single blog post by slug.
 */
export function useBlogPost(slug: string) {
  const post = useQuery(api.blogPosts.getBySlug, { slug });
  return { post: post ?? null, isLoading: post === undefined };
}

/**
 * Hook to fetch social links from Convex.
 */
export function useSocialLinks() {
  const links = useQuery(api.socialLinks.list);
  return { links: links ?? [], isLoading: links === undefined };
}
