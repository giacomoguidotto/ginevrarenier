import type { ProjectMeta } from "@/lib/types";

// Project data - in production this could come from a CMS or JSON files
export const projects: ProjectMeta[] = [
  {
    slug: "oslo",
    count: 11,
  },
  {
    slug: "portraits",
    count: 12,
  },
  {
    slug: "landscapes",
    count: 15,
  },
  {
    slug: "urban",
    count: 10,
  },
  {
    slug: "abstract",
    count: 8,
  },
  {
    slug: "moments",
    count: 20,
  },
  {
    slug: "noir",
    count: 14,
  },
];

export function getProject(slug: string): ProjectMeta | undefined {
  return projects.find((p) => p.slug === slug);
}

export function getProjectImages(slug: string): string[] {
  const project = getProject(slug);
  if (!project) {
    return [];
  }

  // TODO: using SVG placeholders for development. Replace with .jpg for production.
  const extensions = project.slug === "oslo" ? "jpg" : "svg";

  // Generate image filenames based on project.
  return Array.from({ length: project.count }, (_, i) => {
    const num = String(i + 1).padStart(2, "0");
    return `${num}.${extensions}`;
  });
}
