import { v } from "convex/values";
import { Resend } from "resend";
import { internal } from "./_generated/api";
import {
  internalAction,
  internalMutation,
  internalQuery,
  mutation,
} from "./_generated/server";

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
    website: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.website) {
      return;
    }

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

    const { website: _, ...inquiry } = args;
    const inquiryId = await ctx.db.insert("inquiries", {
      ...inquiry,
      emailStatus: "pending",
      attempts: 0,
    });

    await ctx.scheduler.runAfter(0, internal.inquiries.sendInquiryEmail, {
      inquiryId,
    });
  },
});

export const getInquiry = internalQuery({
  args: { inquiryId: v.id("inquiries") },
  handler: async (ctx, args) => await ctx.db.get(args.inquiryId),
});

export const patchInquiry = internalMutation({
  args: {
    inquiryId: v.id("inquiries"),
    emailStatus: v.optional(
      v.union(v.literal("pending"), v.literal("sent"), v.literal("failed"))
    ),
    attempts: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { inquiryId, ...patch } = args;
    await ctx.db.patch(inquiryId, patch);
  },
});

const BACKOFF_DELAYS = [30_000, 120_000, 480_000];

export const sendInquiryEmail = internalAction({
  args: { inquiryId: v.id("inquiries") },
  handler: async (ctx, args) => {
    const inquiry = await ctx.runQuery(internal.inquiries.getInquiry, {
      inquiryId: args.inquiryId,
    });
    if (!inquiry) {
      throw new Error("Inquiry not found");
    }

    const artistEmail = process.env.ARTIST_EMAIL;
    if (!artistEmail) {
      throw new Error("ARTIST_EMAIL env var is not set");
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: "noreply@ginevrarenier.com",
      to: [artistEmail],
      replyTo: inquiry.email,
      subject: `New inquiry: ${inquiry.inquiryType} from ${inquiry.name}`,
      text: [
        `Name: ${inquiry.name}`,
        `Email: ${inquiry.email}`,
        `Type: ${inquiry.inquiryType}`,
        `Message: ${inquiry.message}`,
      ].join("\n"),
    });

    if (error) {
      const newAttempts = inquiry.attempts + 1;
      if (newAttempts <= BACKOFF_DELAYS.length) {
        await ctx.runMutation(internal.inquiries.patchInquiry, {
          inquiryId: args.inquiryId,
          attempts: newAttempts,
        });
        await ctx.scheduler.runAfter(
          BACKOFF_DELAYS[newAttempts - 1],
          internal.inquiries.sendInquiryEmail,
          { inquiryId: args.inquiryId }
        );
      } else {
        await ctx.runMutation(internal.inquiries.patchInquiry, {
          inquiryId: args.inquiryId,
          emailStatus: "failed",
          attempts: newAttempts,
        });
      }
      return;
    }

    await ctx.runMutation(internal.inquiries.patchInquiry, {
      inquiryId: args.inquiryId,
      emailStatus: "sent",
    });
  },
});
