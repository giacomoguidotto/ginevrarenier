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
    tagline: localizedText,
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
    content: v.union(v.string(), v.record(v.string(), localizedText)),
  }).index("by_section", ["section"]),

  achievements: defineTable({
    startYear: v.number(),
    endYear: v.optional(v.number()),
    title: localizedText,
    description: localizedText,
  }).index("by_start_year", ["startYear"]),

  selectedWorks: defineTable({
    projectId: v.id("projects"),
    order: v.number(),
  })
    .index("by_order", ["order"])
    .index("by_project", ["projectId"]),

  // Transition schema: handle is optional until migration populates it.
  // After running socialLinks.migrateToHandles, narrow to { platform, handle, order }.
  inquiries: defineTable({
    name: v.string(),
    email: v.string(),
    inquiryType: v.union(
      v.literal("collaboration"),
      v.literal("commission"),
      v.literal("exhibition"),
      v.literal("press"),
      v.literal("other")
    ),
    message: v.string(),
    emailStatus: v.union(
      v.literal("pending"),
      v.literal("sent"),
      v.literal("failed")
    ),
    attempts: v.number(),
  })
    .index("by_emailStatus", ["emailStatus"])
    .index("by_email", ["email"]),

  socialLinks: defineTable({
    platform: v.string(),
    handle: v.optional(v.string()),
    href: v.optional(v.string()),
    label: v.optional(v.string()),
    value: v.optional(v.string()),
    order: v.number(),
  }).index("by_order", ["order"]),
});
