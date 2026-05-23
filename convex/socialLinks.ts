import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server";
import { adminMutation } from "./functions";

export const list = query({
  args: {},
  handler: async (ctx) =>
    ctx.db.query("socialLinks").withIndex("by_order").collect(),
});

export const create = adminMutation({
  args: {
    platform: v.string(),
    handle: v.string(),
  },
  handler: async (ctx, args) => {
    const all = await ctx.db.query("socialLinks").collect();
    const maxOrder = all.reduce((max, l) => Math.max(max, l.order), -1);

    return ctx.db.insert("socialLinks", {
      platform: args.platform,
      handle: args.handle,
      order: maxOrder + 1,
    });
  },
});

export const update = adminMutation({
  args: {
    id: v.id("socialLinks"),
    platform: v.optional(v.string()),
    handle: v.optional(v.string()),
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

export const reorder = adminMutation({
  args: {
    ids: v.array(v.id("socialLinks")),
  },
  handler: async (ctx, { ids }) => {
    for (let i = 0; i < ids.length; i++) {
      await ctx.db.patch(ids[i], { order: i });
    }
  },
});

export const remove = adminMutation({
  args: { id: v.id("socialLinks") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});

const mailtoRegex = /^mailto:/i;
const trailingSlashRegex = /\/$/;

const hrefPrefixes: Record<string, string> = {
  instagram: "https://www.instagram.com/",
  x: "https://x.com/",
  linkedin: "https://www.linkedin.com/in/",
  facebook: "https://www.facebook.com/",
  tiktok: "https://www.tiktok.com/@",
  youtube: "https://www.youtube.com/@",
  pinterest: "https://www.pinterest.com/",
  threads: "https://www.threads.net/@",
  bluesky: "https://bsky.app/profile/",
  telegram: "https://t.me/",
  behance: "https://www.behance.net/",
  dribbble: "https://dribbble.com/",
  artstation: "https://www.artstation.com/",
  deviantart: "https://www.deviantart.com/",
  unsplash: "https://unsplash.com/@",
  vimeo: "https://vimeo.com/",
};

export const migrateToHandles = internalMutation({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("socialLinks").collect();
    let migrated = 0;

    for (const link of all) {
      if (link.handle) {
        continue;
      }

      let handle: string;
      if (link.platform === "email") {
        handle = (link.href ?? "").replace(mailtoRegex, "");
      } else if (link.platform === "website") {
        handle = link.href ?? "";
      } else {
        const prefix = hrefPrefixes[link.platform];
        if (prefix && link.href?.startsWith(prefix)) {
          handle = link.href
            .slice(prefix.length)
            .replace(trailingSlashRegex, "");
        } else {
          handle = link.value ?? link.href ?? "";
        }
      }

      await ctx.db.patch(link._id, {
        handle,
        href: undefined,
        label: undefined,
        value: undefined,
      });
      migrated++;
    }

    return { migrated, total: all.length };
  },
});
