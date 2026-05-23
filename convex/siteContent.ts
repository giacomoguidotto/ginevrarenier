import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server";
import { adminMutation, adminQuery } from "./functions";

type LocalizedRecord = Record<string, { en: string; it: string }>;

function parseContent(content: string | LocalizedRecord): LocalizedRecord {
  if (typeof content === "string") {
    return JSON.parse(content) as LocalizedRecord;
  }
  return content;
}

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
      content: parseContent(doc.content),
    };
  },
});

export const listAll = adminQuery({
  args: {},
  handler: async (ctx) => {
    const docs = await ctx.db.query("siteContent").collect();
    return docs.map((doc) => ({
      ...doc,
      content: parseContent(doc.content),
    }));
  },
});

const localizedText = v.object({ en: v.string(), it: v.string() });

export const upsert = adminMutation({
  args: {
    section: v.string(),
    content: v.record(v.string(), localizedText),
  },
  handler: async (ctx, { section, content }) => {
    const existing = await ctx.db
      .query("siteContent")
      .withIndex("by_section", (q) => q.eq("section", section))
      .unique();

    if (existing) {
      const existingContent = parseContent(existing.content);
      const merged = { ...existingContent, ...content };
      await ctx.db.patch(existing._id, { content: merged });
    } else {
      await ctx.db.insert("siteContent", { section, content });
    }
  },
});

export const renameAchievementsToHighlights = internalMutation({
  args: {},
  handler: async (ctx) => {
    const doc = await ctx.db
      .query("siteContent")
      .withIndex("by_section", (q) => q.eq("section", "essence.achievements"))
      .unique();
    if (!doc) {
      return { renamed: false };
    }
    await ctx.db.patch(doc._id, { section: "essence.highlights" });
    return { renamed: true };
  },
});

export const migrateToRecord = internalMutation({
  args: {},
  handler: async (ctx) => {
    const docs = await ctx.db.query("siteContent").collect();
    let migrated = 0;
    for (const doc of docs) {
      if (typeof doc.content === "string") {
        const parsed = JSON.parse(doc.content) as LocalizedRecord;
        await ctx.db.patch(doc._id, { content: parsed });
        migrated++;
      }
    }
    return { total: docs.length, migrated };
  },
});
