import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) =>
    ctx.db.query("projects").withIndex("by_order").collect(),
});

export const listPublished = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("projects").withIndex("by_order").collect();
    return all.filter((p) => p.published);
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) =>
    ctx.db
      .query("projects")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique(),
});

export const create = mutation({
  args: {
    slug: v.string(),
    title: v.object({ en: v.string(), it: v.string() }),
    subtitle: v.object({ en: v.string(), it: v.string() }),
    description: v.object({ en: v.string(), it: v.string() }),
    category: v.object({ en: v.string(), it: v.string() }),
  },
  handler: async (ctx, args) => {
    const all = await ctx.db.query("projects").collect();
    const maxOrder = all.reduce((max, p) => Math.max(max, p.order), -1);

    return ctx.db.insert("projects", {
      ...args,
      coverImageUrl: undefined,
      order: maxOrder + 1,
      published: false,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("projects"),
    title: v.optional(v.object({ en: v.string(), it: v.string() })),
    subtitle: v.optional(v.object({ en: v.string(), it: v.string() })),
    description: v.optional(v.object({ en: v.string(), it: v.string() })),
    category: v.optional(v.object({ en: v.string(), it: v.string() })),
    slug: v.optional(v.string()),
    coverImageUrl: v.optional(v.string()),
    published: v.optional(v.boolean()),
  },
  handler: async (ctx, { id, ...fields }) => {
    const existing = await ctx.db.get(id);
    if (!existing) {
      throw new Error("Project not found");
    }

    const updates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) {
        updates[key] = value;
      }
    }

    await ctx.db.patch(id, updates);
  },
});

export const reorder = mutation({
  args: {
    ids: v.array(v.id("projects")),
  },
  handler: async (ctx, { ids }) => {
    for (let i = 0; i < ids.length; i++) {
      await ctx.db.patch(ids[i], { order: i });
    }
  },
});

export const setCover = mutation({
  args: {
    projectId: v.id("projects"),
    imageId: v.id("projectImages"),
  },
  handler: async (ctx, { projectId, imageId }) => {
    const image = await ctx.db.get(imageId);
    if (!image || image.projectId !== projectId) {
      throw new Error("Image does not belong to this project");
    }
    await ctx.db.patch(projectId, { coverImageUrl: image.url });
  },
});

export const remove = mutation({
  args: { id: v.id("projects") },
  handler: async (ctx, { id }) => {
    // Delete all images belonging to this project
    const images = await ctx.db
      .query("projectImages")
      .withIndex("by_project", (q) => q.eq("projectId", id))
      .collect();

    for (const image of images) {
      await ctx.db.delete(image._id);
    }

    await ctx.db.delete(id);
  },
});
