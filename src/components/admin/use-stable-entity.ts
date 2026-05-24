"use client";

import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

type EntityType = "project" | "post";

const SLUG_QUERY = {
  project: api.projects.getBySlug,
  post: api.blogPosts.getBySlug,
} as const;

const ID_QUERY = {
  project: api.projects.getById,
  post: api.blogPosts.getById,
} as const;

export function useStableEntity(entityType: EntityType, slug: string) {
  const router = useRouter();
  const pathname = usePathname();

  const slugResult = useQuery(SLUG_QUERY[entityType], { slug });
  const resolvedId = slugResult?._id as string | undefined;

  const stableIdRef = useRef<string | undefined>(undefined);
  if (resolvedId && !stableIdRef.current) {
    stableIdRef.current = resolvedId;
  }

  const entityResult = useQuery(
    ID_QUERY[entityType],
    stableIdRef.current
      ? ({ id: stableIdRef.current } as
          | { id: Id<"projects"> }
          | { id: Id<"blogPosts"> })
      : "skip"
  );

  const entity = entityResult as
    | (Record<string, unknown> & { slug: string })
    | undefined
    | null;

  const prevSlugRef = useRef(slug);

  useEffect(() => {
    if (!entity || entity.slug === prevSlugRef.current) {
      return;
    }
    const newPath = pathname.replace(prevSlugRef.current, entity.slug);
    prevSlugRef.current = entity.slug;
    router.replace(newPath);
  }, [entity, pathname, router]);

  return {
    id: stableIdRef.current,
    entity: entity ?? undefined,
    isLoading: !stableIdRef.current || entityResult === undefined,
  };
}
