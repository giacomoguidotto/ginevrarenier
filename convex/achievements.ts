import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server";
import { adminMutation } from "./functions";

const localizedText = v.object({ en: v.string(), it: v.string() });

export const list = query({
  args: {},
  handler: async (ctx) =>
    ctx.db.query("achievements").withIndex("by_start_year").collect(),
});

export const getById = query({
  args: { id: v.id("achievements") },
  handler: async (ctx, { id }) => ctx.db.get(id),
});

export const create = adminMutation({
  args: {
    startYear: v.number(),
    endYear: v.optional(v.number()),
    title: localizedText,
    description: localizedText,
  },
  handler: async (ctx, args) => ctx.db.insert("achievements", args),
});

export const update = adminMutation({
  args: {
    id: v.id("achievements"),
    startYear: v.optional(v.number()),
    endYear: v.optional(v.number()),
    title: v.optional(localizedText),
    description: v.optional(localizedText),
  },
  handler: async (ctx, { id, ...fields }) => {
    const existing = await ctx.db.get(id);
    if (!existing) {
      throw new Error("Achievement not found");
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

export const remove = adminMutation({
  args: { id: v.id("achievements") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});

type LocalizedRecord = Record<string, { en: string; it: string }>;

export const migrateFromTimeline = internalMutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("achievements").first();
    if (existing) {
      return { migrated: 0, skipped: true };
    }

    const doc = await ctx.db
      .query("siteContent")
      .withIndex("by_section", (q) => q.eq("section", "essence.timeline"))
      .unique();
    if (!doc) {
      return { migrated: 0, skipped: false };
    }

    const content: LocalizedRecord =
      typeof doc.content === "string"
        ? (JSON.parse(doc.content) as LocalizedRecord)
        : (doc.content as LocalizedRecord);

    const entryIds = new Set<string>();
    for (const key of Object.keys(content)) {
      if (key.endsWith(".title") && key.includes(".")) {
        const prefix = key.slice(0, key.lastIndexOf("."));
        if (content[`${prefix}.year`]) {
          entryIds.add(prefix);
        }
      }
    }

    let migrated = 0;
    for (const entryId of entryIds) {
      const yearStr = content[`${entryId}.year`]?.en ?? "";
      const startYear = Number.parseInt(yearStr, 10);
      if (Number.isNaN(startYear)) {
        continue;
      }

      await ctx.db.insert("achievements", {
        startYear,
        title: content[`${entryId}.title`] ?? { en: "", it: "" },
        description: content[`${entryId}.description`] ?? { en: "", it: "" },
      });

      delete content[`${entryId}.year`];
      delete content[`${entryId}.title`];
      delete content[`${entryId}.description`];
      migrated++;
    }

    await ctx.db.patch(doc._id, { content });
    return { migrated, skipped: false };
  },
});
