import { v } from "convex/values";
import { query } from "./_generated/server";
import { adminMutation, adminQuery } from "./functions";
import { slugify } from "./slugify";

export const list = adminQuery({
  args: {},
  handler: async (ctx) => ctx.db.query("blogPosts").order("desc").collect(),
});

export const listPublished = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db
      .query("blogPosts")
      .withIndex("by_published", (q) => q.eq("published", true))
      .collect();
    return all.sort((a, b) => (b.publishedAt ?? 0) - (a.publishedAt ?? 0));
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const post = await ctx.db
      .query("blogPosts")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
    if (!post) {
      return null;
    }
    if (!post.published) {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) {
        return null;
      }
    }
    return post;
  },
});

export const getById = query({
  args: { id: v.id("blogPosts") },
  handler: async (ctx, { id }) => {
    const post = await ctx.db.get(id);
    if (!post) {
      return null;
    }
    if (!post.published) {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) {
        return null;
      }
    }
    return post;
  },
});

export const create = adminMutation({
  args: {
    title: v.object({ en: v.string(), it: v.string() }),
  },
  handler: async (ctx, { title }) => {
    const all = await ctx.db.query("blogPosts").collect();

    let slug = slugify(title.en);
    const existingSlugs = new Set(all.map((p) => p.slug));
    if (existingSlugs.has(slug)) {
      let counter = 2;
      while (existingSlugs.has(`${slug}-${counter}`)) {
        counter++;
      }
      slug = `${slug}-${counter}`;
    }

    return ctx.db.insert("blogPosts", {
      title,
      slug,
      excerpt: { en: "", it: "" },
      content: { en: "[]", it: "[]" },
      coverImageUrl: undefined,
      publishedAt: undefined,
      published: false,
    });
  },
});

export const update = adminMutation({
  args: {
    id: v.id("blogPosts"),
    slug: v.optional(v.string()),
    title: v.optional(v.object({ en: v.string(), it: v.string() })),
    excerpt: v.optional(v.object({ en: v.string(), it: v.string() })),
    content: v.optional(v.object({ en: v.string(), it: v.string() })),
    coverImageUrl: v.optional(v.string()),
    coverImagePublicId: v.optional(v.string()),
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

export const remove = adminMutation({
  args: { id: v.id("blogPosts") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});
