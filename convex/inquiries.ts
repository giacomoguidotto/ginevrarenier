import { v } from "convex/values";
import { mutation } from "./_generated/server";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

    await ctx.db.insert("inquiries", {
      ...args,
      emailStatus: "pending",
      attempts: 0,
    });
  },
});
