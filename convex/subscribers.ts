import { v } from "convex/values";
import { Resend } from "resend";
import { internal } from "./_generated/api";
import { internalAction, internalQuery, mutation } from "./_generated/server";
import { renderConfirmationEmail } from "./emails/confirmationEmail";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export const subscribe = mutation({
  args: {
    email: v.string(),
    locale: v.string(),
    consentTimestamp: v.number(),
  },
  handler: async (ctx, args) => {
    if (!EMAIL_RE.test(args.email)) {
      throw new Error("Invalid email address");
    }

    const existing = await ctx.db
      .query("subscribers")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    if (existing) {
      if (existing.status === "confirmed") {
        return { status: "already_confirmed" as const };
      }

      const token = generateToken();
      await ctx.db.patch(existing._id, {
        status: "pending",
        confirmationToken: token,
        consentTimestamp: args.consentTimestamp,
        locale: args.locale,
        unsubscribedAt: undefined,
      });

      await ctx.scheduler.runAfter(0, internal.subscribers.sendConfirmation, {
        subscriberId: existing._id,
      });

      return { status: "pending" as const };
    }

    const token = generateToken();
    const subscriberId = await ctx.db.insert("subscribers", {
      email: args.email,
      locale: args.locale,
      status: "pending",
      consentTimestamp: args.consentTimestamp,
      confirmationToken: token,
    });

    await ctx.scheduler.runAfter(0, internal.subscribers.sendConfirmation, {
      subscriberId,
    });

    return { status: "pending" as const };
  },
});

export const confirm = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const subscriber = await ctx.db
      .query("subscribers")
      .withIndex("by_confirmationToken", (q) =>
        q.eq("confirmationToken", args.token)
      )
      .unique();

    if (!subscriber) {
      return { status: "invalid_token" as const };
    }

    if (subscriber.status === "confirmed") {
      return { status: "already_confirmed" as const };
    }

    await ctx.db.patch(subscriber._id, {
      status: "confirmed",
      confirmedAt: Date.now(),
    });

    return { status: "confirmed" as const };
  },
});

export const unsubscribe = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const subscriber = await ctx.db
      .query("subscribers")
      .withIndex("by_confirmationToken", (q) =>
        q.eq("confirmationToken", args.token)
      )
      .unique();

    if (!subscriber) {
      return { status: "invalid_token" as const };
    }

    await ctx.db.patch(subscriber._id, {
      status: "unsubscribed",
      unsubscribedAt: Date.now(),
    });

    return { status: "unsubscribed" as const };
  },
});

export const getSubscriber = internalQuery({
  args: { subscriberId: v.id("subscribers") },
  handler: async (ctx, args) => await ctx.db.get(args.subscriberId),
});

export const sendConfirmation = internalAction({
  args: { subscriberId: v.id("subscribers") },
  handler: async (ctx, args) => {
    const subscriber = await ctx.runQuery(internal.subscribers.getSubscriber, {
      subscriberId: args.subscriberId,
    });
    if (!subscriber) {
      return;
    }

    const siteUrl = process.env.SITE_URL ?? "https://ginevrarenier.com";
    const confirmUrl = `${siteUrl}/confirm?token=${subscriber.confirmationToken}`;
    const locale = subscriber.locale === "it" ? "it" : "en";

    const html = await renderConfirmationEmail({ confirmUrl, locale });

    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: "Ginevra Renier Studio <noreply@ginevrarenier.com>",
      to: [subscriber.email],
      subject:
        locale === "it"
          ? "Conferma la tua iscrizione"
          : "Confirm your subscription",
      html,
    });
  },
});
