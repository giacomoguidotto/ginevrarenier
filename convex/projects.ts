import { v } from "convex/values";
import { query } from "./_generated/server";
import { adminMutation, adminQuery } from "./functions";
import { slugify } from "./slugify";

export const list = adminQuery({
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
  handler: async (ctx, { slug }) => {
    const project = await ctx.db
      .query("projects")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
    if (!project) {
      return null;
    }
    if (!project.published) {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) {
        return null;
      }
    }
    return project;
  },
});

export const getById = query({
  args: { id: v.id("projects") },
  handler: async (ctx, { id }) => {
    const project = await ctx.db.get(id);
    if (!project) {
      return null;
    }
    if (!project.published) {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) {
        return null;
      }
    }
    return project;
  },
});

export const create = adminMutation({
  args: {
    title: v.object({ en: v.string(), it: v.string() }),
  },
  handler: async (ctx, { title }) => {
    const all = await ctx.db.query("projects").collect();
    const maxOrder = all.reduce((max, p) => Math.max(max, p.order), -1);

    let slug = slugify(title.en);
    const existingSlugs = new Set(all.map((p) => p.slug));
    if (existingSlugs.has(slug)) {
      let counter = 2;
      while (existingSlugs.has(`${slug}-${counter}`)) {
        counter++;
      }
      slug = `${slug}-${counter}`;
    }

    return ctx.db.insert("projects", {
      title,
      slug,
      subtitle: { en: "", it: "" },
      description: { en: "", it: "" },
      tagline: { en: "", it: "" },
      coverImageUrl: undefined,
      order: maxOrder + 1,
      published: false,
    });
  },
});

export const update = adminMutation({
  args: {
    id: v.id("projects"),
    title: v.optional(v.object({ en: v.string(), it: v.string() })),
    subtitle: v.optional(v.object({ en: v.string(), it: v.string() })),
    description: v.optional(v.object({ en: v.string(), it: v.string() })),
    tagline: v.optional(v.object({ en: v.string(), it: v.string() })),
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

export const reorder = adminMutation({
  args: {
    ids: v.array(v.id("projects")),
  },
  handler: async (ctx, { ids }) => {
    for (let i = 0; i < ids.length; i++) {
      await ctx.db.patch(ids[i], { order: i });
    }
  },
});

export const setCover = adminMutation({
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

export const remove = adminMutation({
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
