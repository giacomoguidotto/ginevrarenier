import { Instagram, Mail } from "lucide-react";
import type { ProjectMeta, SocialLink } from "@/lib/types";

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

export const socials: SocialLink[] = [
  {
    href: "https://www.instagram.com/ginevra.renier/",
    label: "Instagram",
    icon: Instagram,
    value: "@ginevrarenier",
  },
  {
    href: "mailto:ginevrarenier@gmail.com",
    label: "email",
    icon: Mail,
    value: "ginevrarenier@gmail.com",
  },
];
