import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => ctx.db.query("blogPosts").collect(),
});

export const listPublished = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db
      .query("blogPosts")
      .withIndex("by_published", (q) => q.eq("published", true))
      .collect();
    // Sort by publishedAt descending
    return all.sort((a, b) => (b.publishedAt ?? 0) - (a.publishedAt ?? 0));
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) =>
    ctx.db
      .query("blogPosts")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique(),
});

export const create = mutation({
  args: {
    slug: v.string(),
    title: v.object({ en: v.string(), it: v.string() }),
    excerpt: v.object({ en: v.string(), it: v.string() }),
  },
  handler: async (ctx, args) =>
    ctx.db.insert("blogPosts", {
      ...args,
      content: { en: "[]", it: "[]" },
      coverImageUrl: undefined,
      publishedAt: undefined,
      published: false,
    }),
});

export const update = mutation({
  args: {
    id: v.id("blogPosts"),
    slug: v.optional(v.string()),
    title: v.optional(v.object({ en: v.string(), it: v.string() })),
    excerpt: v.optional(v.object({ en: v.string(), it: v.string() })),
    content: v.optional(v.object({ en: v.string(), it: v.string() })),
    coverImageUrl: v.optional(v.string()),
    published: v.optional(v.boolean()),
  },
  handler: async (ctx, { id, published, ...fields }) => {
    const existing = await ctx.db.get(id);
    if (!existing) {
      throw new Error("Blog post not found");
    }

    const updates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) {
        updates[key] = value;
      }
    }

    // Set publishedAt when first published
    if (published === true && !existing.publishedAt) {
      updates.publishedAt = Date.now();
    }
    if (published !== undefined) {
      updates.published = published;
    }

    await ctx.db.patch(id, updates);
  },
});

export const remove = mutation({
  args: { id: v.id("blogPosts") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});
