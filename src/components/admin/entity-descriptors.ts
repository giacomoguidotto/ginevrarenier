import { api } from "convex/_generated/api";
import type { FunctionReference } from "convex/server";

export interface EntityDescriptor {
  buildUpdates?: (
    fields: Record<string, Record<string, string>>
  ) => Record<string, unknown>;
  collection?: {
    list: FunctionReference<"query", "public">;
    getByKey?: FunctionReference<"query", "public">;
  };
  formatRef: (id: string, sectionLabels: ReadonlyMap<string, string>) => string;
  label: string;
  localized: boolean;
  mutations: {
    update: FunctionReference<"mutation", "public", Record<string, unknown>>;
    remove: FunctionReference<"mutation", "public", { id: string }>;
  };
  parent?: { entityType: string };
  publish?: { listPublished: FunctionReference<"query", "public"> };
  reorder?: {
    mutation: FunctionReference<"mutation", "public", { ids: string[] }>;
  };
  type: string;
}

export type SectionRoute =
  | { kind: "siteContent"; section: string }
  | { kind: "entity"; descriptor: EntityDescriptor; id: string };

function makeFormatRef(entityType: string, label: string) {
  return (id: string, sectionLabels: ReadonlyMap<string, string>): string =>
    sectionLabels.get(`${entityType}:${id}`) ?? label;
}

const projectDescriptor: EntityDescriptor = {
  type: "project",
  label: "Project",
  formatRef: makeFormatRef("project", "Project"),
  mutations: {
    update: api.projects.update as never,
    remove: api.projects.remove as never,
  },
  collection: {
    list: api.projects.list as never,
    getByKey: api.projects.getBySlug as never,
  },
  publish: { listPublished: api.projects.listPublished as never },
  reorder: { mutation: api.projects.reorder as never },
  localized: true,
};

const postDescriptor: EntityDescriptor = {
  type: "post",
  label: "Post",
  formatRef: makeFormatRef("post", "Post"),
  mutations: {
    update: api.blogPosts.update as never,
    remove: api.blogPosts.remove as never,
  },
  collection: {
    list: api.blogPosts.list as never,
    getByKey: api.blogPosts.getBySlug as never,
  },
  publish: { listPublished: api.blogPosts.listPublished as never },
  localized: true,
};

function buildAchievementUpdates(
  fields: Record<string, Record<string, string>>
): Record<string, unknown> {
  const updates: Record<string, unknown> = {};
  for (const [field, locales] of Object.entries(fields)) {
    if (field === "startYear" || field === "endYear") {
      const val = locales.en ?? locales.it;
      if (val !== undefined) {
        updates[field] = Number.parseInt(val, 10);
      }
    } else {
      updates[field] = locales as { en: string; it: string };
    }
  }
  return updates;
}

const achievementDescriptor: EntityDescriptor = {
  type: "achievement",
  label: "Achievement",
  formatRef: makeFormatRef("achievement", "Achievement"),
  buildUpdates: buildAchievementUpdates,
  mutations: {
    update: api.achievements.update as never,
    remove: api.achievements.remove as never,
  },
  collection: {
    list: api.achievements.list as never,
  },
  localized: true,
};

const registry = new Map<string, EntityDescriptor>([
  ["project", projectDescriptor],
  ["post", postDescriptor],
  ["achievement", achievementDescriptor],
]);

export function getDescriptor(
  entityType: string
): EntityDescriptor | undefined {
  return registry.get(entityType);
}

export function routeSection(section: string): SectionRoute {
  const colon = section.indexOf(":");
  if (colon !== -1) {
    const prefix = section.slice(0, colon);
    const descriptor = registry.get(prefix);
    if (descriptor) {
      return { kind: "entity", descriptor, id: section.slice(colon + 1) };
    }
  }
  return { kind: "siteContent", section };
}

export function formatEntityRef(
  entityType: string,
  id: string,
  sectionLabels: ReadonlyMap<string, string>
): string {
  const label = sectionLabels.get(`${entityType}:${id}`);
  if (label) {
    return label;
  }
  const descriptor = registry.get(entityType);
  if (descriptor) {
    return descriptor.label;
  }
  return humanizeType(entityType);
}

export function formatEntityType(entityType: string): string {
  const descriptor = registry.get(entityType);
  if (descriptor) {
    return descriptor.label;
  }
  return humanizeType(entityType);
}

function humanizeType(entityType: string): string {
  return entityType
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
