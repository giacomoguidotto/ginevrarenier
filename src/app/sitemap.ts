import { api } from "convex/_generated/api";
import { fetchQuery } from "convex/nextjs";
import type { MetadataRoute } from "next";
import { locales } from "@/i18n/config";

const baseUrl = "https://ginevrarenier.com";

const staticPages = ["", "/vision", "/reflections", "/essence", "/connect"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [projects, posts] = await Promise.all([
    fetchQuery(api.projects.listPublished, {}),
    fetchQuery(api.blogPosts.listPublished, {}),
  ]);

  const projectImagesBySlug = new Map<string, string[]>();
  await Promise.all(
    projects.map(async (project) => {
      const images = await fetchQuery(api.projectImages.listByProject, {
        projectId: project._id,
      });
      projectImagesBySlug.set(
        project.slug,
        images.map((img) => img.url)
      );
    })
  );

  const staticEntries: MetadataRoute.Sitemap = staticPages.flatMap((page) =>
    locales.map((locale) => ({
      url: `${baseUrl}/${locale}${page}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: page === "" ? 1.0 : 0.8,
      alternates: {
        languages: Object.fromEntries(
          locales.map((l) => [l, `${baseUrl}/${l}${page}`])
        ),
      },
    }))
  );

  const projectEntries: MetadataRoute.Sitemap = projects.flatMap((project) =>
    locales.map((locale) => ({
      url: `${baseUrl}/${locale}/vision/${project.slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.7,
      alternates: {
        languages: Object.fromEntries(
          locales.map((l) => [l, `${baseUrl}/${l}/vision/${project.slug}`])
        ),
      },
      images: projectImagesBySlug.get(project.slug) ?? [],
    }))
  );

  const postEntries: MetadataRoute.Sitemap = posts.flatMap((post) =>
    locales.map((locale) => ({
      url: `${baseUrl}/${locale}/reflections/${post.slug}`,
      lastModified: post.publishedAt ? new Date(post.publishedAt) : new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.6,
      alternates: {
        languages: Object.fromEntries(
          locales.map((l) => [l, `${baseUrl}/${l}/reflections/${post.slug}`])
        ),
      },
      ...(post.coverImageUrl ? { images: [post.coverImageUrl] } : {}),
    }))
  );

  return [...staticEntries, ...projectEntries, ...postEntries];
}
