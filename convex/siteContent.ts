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
    deleteKeyPrefixes: v.optional(v.array(v.string())),
  },
  handler: async (ctx, { section, content, deleteKeyPrefixes }) => {
    const existing = await ctx.db
      .query("siteContent")
      .withIndex("by_section", (q) => q.eq("section", section))
      .unique();

    if (existing) {
      const existingContent = JSON.parse(existing.content);
      const newContent = JSON.parse(content);
      const merged = { ...existingContent, ...newContent };

      if (deleteKeyPrefixes?.length) {
        for (const key of Object.keys(merged)) {
          if (deleteKeyPrefixes.some((p) => key.startsWith(`${p}.`))) {
            delete merged[key];
          }
        }
      }

      await ctx.db.patch(existing._id, {
        content: JSON.stringify(merged),
      });
    } else {
      await ctx.db.insert("siteContent", { section, content });
    }
  },
});
