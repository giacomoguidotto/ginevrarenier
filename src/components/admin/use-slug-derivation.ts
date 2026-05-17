"use client";

import { api } from "convex/_generated/api";
import { useQuery } from "convex/react";
import { useEffect, useRef } from "react";
import { useDraftBufferOps, useEditVersion } from "./draft-buffer-context";
import { slugify } from "./slugify";

export function useSlugDerivation(
  section: string,
  entityType: "project" | "post",
  currentSlug: string | undefined
) {
  const { read, write } = useDraftBufferOps();
  useEditVersion();

  const draftTitle = read(section, "title", "en");
  const derivedSlug = draftTitle ? slugify(draftTitle) : undefined;

  const allProjects = useQuery(
    entityType === "project" ? api.projects.list : api.blogPosts.list
  );

  const prevDerivedRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!derivedSlug || derivedSlug === currentSlug) {
      return;
    }
    if (derivedSlug === prevDerivedRef.current) {
      return;
    }
    prevDerivedRef.current = derivedSlug;

    let slug = derivedSlug;
    if (allProjects) {
      const existing = new Set(
        (allProjects as Array<{ slug: string }>).map((e) => e.slug)
      );
      existing.delete(currentSlug ?? "");
      if (existing.has(slug)) {
        let counter = 2;
        while (existing.has(`${slug}-${counter}`)) {
          counter++;
        }
        slug = `${slug}-${counter}`;
      }
    }

    write(section, "slug", "en", slug);
  }, [derivedSlug, currentSlug, section, write, allProjects]);

  const draftSlug = read(section, "slug", "en");
  return { derivedSlug: draftSlug ?? currentSlug };
}
