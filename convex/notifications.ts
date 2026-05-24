import { v } from "convex/values";
import { Resend } from "resend";
import { internal } from "./_generated/api";
import { internalAction, internalQuery } from "./_generated/server";
import { renderPublishNotificationEmail } from "./emails/publishNotificationEmail";

export const getPublishNotificationData = internalQuery({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project?.published) {
      return null;
    }

    const subscribers = await ctx.db
      .query("subscribers")
      .withIndex("by_status", (q) => q.eq("status", "confirmed"))
      .collect();

    const allPosts = await ctx.db
      .query("blogPosts")
      .withIndex("by_published", (q) => q.eq("published", true))
      .collect();
    const recentPosts = allPosts
      .sort((a, b) => (b.publishedAt ?? 0) - (a.publishedAt ?? 0))
      .slice(0, 3);

    return { project, subscribers, recentPosts };
  },
});

export const sendPublishNotification = internalAction({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const data = await ctx.runQuery(
      internal.notifications.getPublishNotificationData,
      { projectId: args.projectId }
    );
    if (!data || data.subscribers.length === 0) {
      return;
    }

    const { project, subscribers, recentPosts } = data;
    const siteUrl = process.env.SITE_URL ?? "https://ginevrarenier.com";
    const resend = new Resend(process.env.RESEND_API_KEY);

    for (const subscriber of subscribers) {
      const locale = subscriber.locale === "it" ? "it" : "en";
      const projectUrl = `${siteUrl}/${locale}/work/${project.slug}`;
      const unsubscribeUrl = `${siteUrl}/unsubscribe?token=${subscriber.confirmationToken}`;

      const postEntries = recentPosts.map((post) => ({
        title: post.title[locale],
        url: `${siteUrl}/${locale}/reflections/${post.slug}`,
      }));

      const html = await renderPublishNotificationEmail({
        projectTitle: project.title[locale],
        projectDescription: project.description[locale],
        projectUrl,
        coverImageUrl: project.coverImageUrl ?? undefined,
        recentPosts: postEntries,
        unsubscribeUrl,
        locale,
      });

      await resend.emails.send({
        from: "Ginevra Renier Studio <noreply@ginevrarenier.com>",
        to: [subscriber.email],
        subject:
          locale === "it"
            ? `Nuovo progetto: ${project.title.it}`
            : `New project: ${project.title.en}`,
        html,
      });
    }
  },
});
