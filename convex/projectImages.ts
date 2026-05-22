import { v } from "convex/values";
import { query } from "./_generated/server";
import { adminMutation } from "./functions";

export const listByProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) =>
    ctx.db
      .query("projectImages")
      .withIndex("by_project_and_order", (q) => q.eq("projectId", projectId))
      .collect(),
});

export const add = adminMutation({
  args: {
    projectId: v.id("projects"),
    url: v.string(),
    cloudinaryPublicId: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("projectImages")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    const maxOrder = existing.reduce(
      (max, img) => Math.max(max, img.order),
      -1
    );

    const imageId = await ctx.db.insert("projectImages", {
      ...args,
      order: maxOrder + 1,
    });

    // If this is the first image, set it as cover
    if (existing.length === 0) {
      const image = await ctx.db.get(imageId);
      if (image) {
        await ctx.db.patch(args.projectId, { coverImageUrl: image.url });
      }
    }

    return imageId;
  },
});

export const reorder = adminMutation({
  args: {
    ids: v.array(v.id("projectImages")),
  },
  handler: async (ctx, { ids }) => {
    for (let i = 0; i < ids.length; i++) {
      await ctx.db.patch(ids[i], { order: i });
    }
  },
});

export const remove = adminMutation({
  args: { id: v.id("projectImages") },
  handler: async (ctx, { id }) => {
    const image = await ctx.db.get(id);
    if (!image) {
      return null;
    }

    const project = await ctx.db.get(image.projectId);
    if (project?.coverImageUrl === image.url) {
      const remaining = await ctx.db
        .query("projectImages")
        .withIndex("by_project_and_order", (q) =>
          q.eq("projectId", image.projectId)
        )
        .collect();

      const next = remaining.find((img) => img._id !== id);
      await ctx.db.patch(image.projectId, {
        coverImageUrl: next?.url ?? undefined,
      });
    }

    await ctx.db.delete(id);

    return image.cloudinaryPublicId;
  },
});
