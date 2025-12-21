// Shared types that can be imported by both client and server components

import type { LucideIcon } from "lucide-react";

export type BlogPost = {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  coverImage: string;
  content: string;
  readingTime: string;
};

export type BlogPostMeta = {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  coverImage: string;
  readingTime: string;
};

export type ProjectMeta = {
  slug: string;
  count: number;
};

export type SocialLink = {
  href: string;
  label: string;
  icon: LucideIcon;
  value: string;
};
