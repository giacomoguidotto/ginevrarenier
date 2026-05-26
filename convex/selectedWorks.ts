import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { query } from "./_generated/server";
import { adminMutation, adminQuery } from "./functions";

export const listPublished = query({
  args: {},
  handler: async (ctx) => {
    const selectedWorks = await ctx.db
      .query("selectedWorks")
      .withIndex("by_order")
      .collect();
    const projects: Doc<"projects">[] = [];
    for (const sw of selectedWorks) {
      const project = await ctx.db.get(sw.projectId);
      if (project?.published) {
        projects.push(project);
      }
    }
    return projects;
  },
});

export const list = adminQuery({
  args: {},
  handler: async (ctx) =>
    ctx.db.query("selectedWorks").withIndex("by_order").collect(),
});

export const create = adminMutation({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, { projectId }) => {
    const existing = await ctx.db
      .query("selectedWorks")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .unique();
    if (existing) {
      throw new Error("Project is already in Selected Works");
    }

    const all = await ctx.db.query("selectedWorks").collect();
    const maxOrder = all.reduce((max, sw) => Math.max(max, sw.order), -1);

    return ctx.db.insert("selectedWorks", {
      projectId,
      order: maxOrder + 1,
    });
  },
});

export const createWithOrder = adminMutation({
  args: {
    projectId: v.id("projects"),
    order: v.number(),
  },
  handler: async (ctx, { projectId, order }) => {
    const existing = await ctx.db
      .query("selectedWorks")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .unique();
    if (existing) {
      throw new Error("Project is already in Selected Works");
    }

    return ctx.db.insert("selectedWorks", { projectId, order });
  },
});

export const remove = adminMutation({
  args: { id: v.id("selectedWorks") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});

export const reorder = adminMutation({
  args: {
    ids: v.array(v.id("projects")),
  },
  handler: async (ctx, { ids }) => {
    for (let i = 0; i < ids.length; i++) {
      const sw = await ctx.db
        .query("selectedWorks")
        .withIndex("by_project", (q) => q.eq("projectId", ids[i]))
        .unique();
      if (sw) {
        await ctx.db.patch(sw._id, { order: i });
      }
    }
  },
});
