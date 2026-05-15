import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db
      .query("socialLinks")
      .withIndex("by_order")
      .collect();
    const seen = new Set<string>();
    return all.filter((link) => {
      if (seen.has(link.platform)) {
        return false;
      }
      seen.add(link.platform);
      return true;
    });
  },
});

export const create = mutation({
  args: {
    platform: v.string(),
    href: v.string(),
    label: v.string(),
    value: v.string(),
  },
  handler: async (ctx, args) => {
    const all = await ctx.db.query("socialLinks").collect();
    const maxOrder = all.reduce((max, l) => Math.max(max, l.order), -1);

    return ctx.db.insert("socialLinks", {
      ...args,
      order: maxOrder + 1,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("socialLinks"),
    platform: v.optional(v.string()),
    href: v.optional(v.string()),
    label: v.optional(v.string()),
    value: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...fields }) => {
    const existing = await ctx.db.get(id);
    if (!existing) {
      throw new Error("Social link not found");
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
    ids: v.array(v.id("socialLinks")),
  },
  handler: async (ctx, { ids }) => {
    for (let i = 0; i < ids.length; i++) {
      await ctx.db.patch(ids[i], { order: i });
    }
  },
});

export const remove = mutation({
  args: { id: v.id("socialLinks") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});
