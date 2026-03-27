import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Bilingual text field validator.
 * All user-facing content supports English and Italian.
 */
const localizedText = v.object({
  en: v.string(),
  it: v.string(),
});

export default defineSchema({
  /**
   * Projects table
   *
   * Photography project galleries with bilingual metadata.
   */
  projects: defineTable({
    slug: v.string(),
    title: localizedText,
    subtitle: localizedText,
    description: localizedText,
    category: localizedText,
    coverImageUrl: v.optional(v.string()),
    order: v.number(),
    published: v.boolean(),
  })
    .index("by_slug", ["slug"])
    .index("by_order", ["order"]),

  /**
   * Project images table
   *
   * Individual images belonging to a project, stored in Cloudinary.
   */
  projectImages: defineTable({
    projectId: v.id("projects"),
    url: v.string(),
    cloudinaryPublicId: v.string(),
    order: v.number(),
  })
    .index("by_project", ["projectId"])
    .index("by_project_and_order", ["projectId", "order"]),

  /**
   * Blog posts table
   *
   * Journal entries with BlockNote JSON content, per locale.
   */
  blogPosts: defineTable({
    slug: v.string(),
    title: localizedText,
    excerpt: localizedText,
    // BlockNote JSON content stored as string per locale
    content: v.object({
      en: v.string(),
      it: v.string(),
    }),
    coverImageUrl: v.optional(v.string()),
    publishedAt: v.optional(v.number()),
    published: v.boolean(),
  })
    .index("by_slug", ["slug"])
    .index("by_published", ["published"]),

  /**
   * Site content table
   *
   * Flexible key-value store for editable page sections.
   * Each row represents a page section (hero, intro, essence, etc.)
   * with a JSON object of bilingual fields.
   */
  siteContent: defineTable({
    section: v.string(),
    // Stored as JSON string to allow flexible nested structures
    content: v.string(),
  }).index("by_section", ["section"]),

  /**
   * Social links table
   *
   * External social media and contact links.
   */
  socialLinks: defineTable({
    platform: v.string(),
    href: v.string(),
    label: v.string(),
    value: v.string(),
    order: v.number(),
  }).index("by_order", ["order"]),
});
