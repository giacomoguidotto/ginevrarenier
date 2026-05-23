import { v } from "convex/values";
import { mutation } from "./_generated/server";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const PER_EMAIL_LIMIT = 3;
const PER_EMAIL_WINDOW_MS = 24 * 60 * 60 * 1000;
const GLOBAL_LIMIT = 20;
const GLOBAL_WINDOW_MS = 60 * 60 * 1000;

export const submit = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    inquiryType: v.union(
      v.literal("collaboration"),
      v.literal("commission"),
      v.literal("exhibition"),
      v.literal("press"),
      v.literal("other")
    ),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    if (!args.name.trim()) {
      throw new Error("Name is required");
    }
    if (!EMAIL_RE.test(args.email)) {
      throw new Error("Invalid email address");
    }
    if (!args.message.trim()) {
      throw new Error("Message is required");
    }

    const now = Date.now();

    const recentByEmail = await ctx.db
      .query("inquiries")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .order("desc")
      .take(PER_EMAIL_LIMIT);
    if (
      recentByEmail.length >= PER_EMAIL_LIMIT &&
      recentByEmail[PER_EMAIL_LIMIT - 1]._creationTime >
        now - PER_EMAIL_WINDOW_MS
    ) {
      throw new Error("Too many submissions, please try again later");
    }

    const recentGlobal = await ctx.db
      .query("inquiries")
      .order("desc")
      .take(GLOBAL_LIMIT);
    if (
      recentGlobal.length >= GLOBAL_LIMIT &&
      recentGlobal[GLOBAL_LIMIT - 1]._creationTime > now - GLOBAL_WINDOW_MS
    ) {
      throw new Error("Too many submissions, please try again later");
    }

    await ctx.db.insert("inquiries", {
      ...args,
      emailStatus: "pending",
      attempts: 0,
    });
  },
});
