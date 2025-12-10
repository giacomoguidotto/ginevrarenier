import type { Project } from "@/components/gallery/project-grid";

// Project data - in production this could come from a CMS or JSON files
export const projects: Project[] = [
  {
    slug: "portraits",
    title: "Portraits",
    description:
      "A journey into the human soul. Each portrait tells a unique story of emotion, strength, and vulnerability.",
    coverImage: "/images/projects/portraits/cover.svg",
    category: "People",
    imageCount: 12,
  },
  {
    slug: "landscapes",
    title: "Landscapes",
    description:
      "Nature's grandeur captured in moments of perfect light. From misty mornings to golden sunsets.",
    coverImage: "/images/projects/landscapes/cover.svg",
    category: "Nature",
    imageCount: 15,
  },
  {
    slug: "urban",
    title: "Urban",
    description:
      "The poetry of cities. Architecture, streets, and the pulse of urban life through a contemplative lens.",
    coverImage: "/images/projects/urban/cover.svg",
    category: "Architecture",
    imageCount: 10,
  },
  {
    slug: "abstract",
    title: "Abstract",
    description:
      "Beyond representation. Exploring form, color, and texture in ways that challenge perception.",
    coverImage: "/images/projects/abstract/cover.svg",
    category: "Experimental",
    imageCount: 8,
  },
  {
    slug: "moments",
    title: "Fleeting Moments",
    description:
      "Life's ephemeral beauty. Candid captures of joy, contemplation, and human connection.",
    coverImage: "/images/projects/moments/cover.svg",
    category: "Documentary",
    imageCount: 20,
  },
  {
    slug: "noir",
    title: "Noir",
    description:
      "A study in contrasts. Black and white photography that embraces shadow and light.",
    coverImage: "/images/projects/noir/cover.svg",
    category: "Black & White",
    imageCount: 14,
  },
];

export function getProject(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}

export function getProjectImages(slug: string): string[] {
  const project = getProject(slug);
  if (!project) {
    return [];
  }

  // Generate image filenames based on project
  // Using SVG placeholders for development - replace with .jpg for production
  return Array.from({ length: project.imageCount }, (_, i) => {
    const num = String(i + 1).padStart(2, "0");
    return `${num}.svg`;
  });
}

export function getAllProjectSlugs(): string[] {
  return projects.map((p) => p.slug);
}
