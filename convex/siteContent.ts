import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getBySection = query({
  args: { section: v.string() },
  handler: async (ctx, { section }) => {
    const doc = await ctx.db
      .query("siteContent")
      .withIndex("by_section", (q) => q.eq("section", section))
      .unique();

    if (!doc) {
      return null;
    }
    return {
      ...doc,
      content: JSON.parse(doc.content) as Record<
        string,
        { en: string; it: string }
      >,
    };
  },
});

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    const docs = await ctx.db.query("siteContent").collect();
    return docs.map((doc) => ({
      ...doc,
      content: JSON.parse(doc.content) as Record<
        string,
        { en: string; it: string }
      >,
    }));
  },
});

export const upsert = mutation({
  args: {
    section: v.string(),
    content: v.string(),
  },
  handler: async (ctx, { section, content }) => {
    const existing = await ctx.db
      .query("siteContent")
      .withIndex("by_section", (q) => q.eq("section", section))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { content });
    } else {
      await ctx.db.insert("siteContent", { section, content });
    }
  },
});
