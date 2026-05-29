import { api } from "convex/_generated/api";
import { fetchQuery } from "convex/nextjs";
import type { MetadataRoute } from "next";
import { localePath, locales } from "@/i18n/config";
import { languageAlternates, siteOrigin } from "@/lib/seo-url";

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
      url: `${siteOrigin}${localePath(locale, page)}`,
      changeFrequency: "monthly" as const,
      priority: page === "" ? 1.0 : 0.8,
      alternates: {
        languages: languageAlternates(page),
      },
    }))
  );

  const projectEntries: MetadataRoute.Sitemap = projects.flatMap((project) =>
    locales.map((locale) => ({
      url: `${siteOrigin}${localePath(locale, `/vision/${project.slug}`)}`,
      ...(project.publishedAt
        ? { lastModified: new Date(project.publishedAt) }
        : {}),
      changeFrequency: "monthly" as const,
      priority: 0.7,
      alternates: {
        languages: languageAlternates(`/vision/${project.slug}`),
      },
      images: projectImagesBySlug.get(project.slug) ?? [],
    }))
  );

  const postEntries: MetadataRoute.Sitemap = posts.flatMap((post) =>
    locales.map((locale) => ({
      url: `${siteOrigin}${localePath(locale, `/reflections/${post.slug}`)}`,
      ...(post.publishedAt ? { lastModified: new Date(post.publishedAt) } : {}),
      changeFrequency: "weekly" as const,
      priority: 0.6,
      alternates: {
        languages: languageAlternates(`/reflections/${post.slug}`),
      },
      ...(post.coverImageUrl ? { images: [post.coverImageUrl] } : {}),
    }))
  );

  return [...staticEntries, ...projectEntries, ...postEntries];
}
