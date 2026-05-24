// @vitest-environment edge-runtime
/// <reference types="vite/client" />

import { convexTest } from "convex-test";
import { describe, expect, it, vi } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const mockSend = vi.fn();
vi.mock("resend", () => ({
  Resend: class {
    emails = { send: mockSend };
  },
}));

vi.mock("@react-email/render", () => ({
  render: (element: unknown) =>
    Promise.resolve(JSON.stringify(element, null, 0)),
}));

const modules = import.meta.glob("./**/*.{ts,tsx}");

describe("publish notification trigger", () => {
  it("sends email to confirmed subscriber when project is published", async () => {
    vi.useFakeTimers();
    mockSend.mockReset();
    mockSend.mockResolvedValue({ data: { id: "test-id" }, error: null });
    process.env.RESEND_API_KEY = "re_test_key";
    process.env.SITE_URL = "https://ginevrarenier.com";

    const t = convexTest(schema, modules);

    await t.run(async (ctx) => {
      await ctx.db.insert("subscribers", {
        email: "subscriber@example.com",
        locale: "en",
        status: "confirmed",
        consentTimestamp: 1000,
        confirmationToken: "tok-123",
        confirmedAt: 2000,
      });
    });

    const projectId = await t.run(async (ctx) =>
      ctx.db.insert("projects", {
        slug: "new-work",
        title: { en: "New Work", it: "Nuovo Lavoro" },
        subtitle: { en: "", it: "" },
        description: {
          en: "A beautiful new project",
          it: "Un bellissimo nuovo progetto",
        },
        tagline: { en: "", it: "" },
        order: 0,
        published: false,
      })
    );

    const asAdmin = t.withIdentity({ name: "Admin" });
    await asAdmin.mutation(api.projects.update, {
      id: projectId,
      published: true,
    });

    await t.finishAllScheduledFunctions(() => {
      vi.advanceTimersByTime(1);
    });

    expect(mockSend).toHaveBeenCalledTimes(1);
    const call = mockSend.mock.calls[0][0];
    expect(call.to).toEqual(["subscriber@example.com"]);
    expect(call.html).toContain("New Work");

    vi.useRealTimers();
  });

  it("does NOT re-send when updating an already-published project", async () => {
    vi.useFakeTimers();
    mockSend.mockReset();
    mockSend.mockResolvedValue({ data: { id: "test-id" }, error: null });
    process.env.RESEND_API_KEY = "re_test_key";
    process.env.SITE_URL = "https://ginevrarenier.com";

    const t = convexTest(schema, modules);

    await t.run(async (ctx) => {
      await ctx.db.insert("subscribers", {
        email: "subscriber@example.com",
        locale: "en",
        status: "confirmed",
        consentTimestamp: 1000,
        confirmationToken: "tok-123",
        confirmedAt: 2000,
      });
    });

    const projectId = await t.run(async (ctx) =>
      ctx.db.insert("projects", {
        slug: "already-published",
        title: { en: "Old Work", it: "Vecchio Lavoro" },
        subtitle: { en: "", it: "" },
        description: { en: "", it: "" },
        tagline: { en: "", it: "" },
        order: 0,
        published: true,
        publishedAt: 1000,
      })
    );

    const asAdmin = t.withIdentity({ name: "Admin" });
    await asAdmin.mutation(api.projects.update, {
      id: projectId,
      published: true,
      title: { en: "Updated Title", it: "Titolo Aggiornato" },
    });

    await t.finishAllScheduledFunctions(() => {
      vi.advanceTimersByTime(1);
    });

    expect(mockSend).not.toHaveBeenCalled();

    vi.useRealTimers();
  });

  it("sends notification again after un-publish then re-publish", async () => {
    vi.useFakeTimers();
    mockSend.mockReset();
    mockSend.mockResolvedValue({ data: { id: "test-id" }, error: null });
    process.env.RESEND_API_KEY = "re_test_key";
    process.env.SITE_URL = "https://ginevrarenier.com";

    const t = convexTest(schema, modules);

    await t.run(async (ctx) => {
      await ctx.db.insert("subscribers", {
        email: "subscriber@example.com",
        locale: "en",
        status: "confirmed",
        consentTimestamp: 1000,
        confirmationToken: "tok-123",
        confirmedAt: 2000,
      });
    });

    const projectId = await t.run(async (ctx) =>
      ctx.db.insert("projects", {
        slug: "cycled-project",
        title: { en: "Cycled", it: "Ciclato" },
        subtitle: { en: "", it: "" },
        description: { en: "", it: "" },
        tagline: { en: "", it: "" },
        order: 0,
        published: true,
        publishedAt: 1000,
      })
    );

    const asAdmin = t.withIdentity({ name: "Admin" });

    await asAdmin.mutation(api.projects.update, {
      id: projectId,
      published: false,
    });

    await t.finishAllScheduledFunctions(() => {
      vi.advanceTimersByTime(1);
    });

    expect(mockSend).not.toHaveBeenCalled();

    await asAdmin.mutation(api.projects.update, {
      id: projectId,
      published: true,
    });

    await t.finishAllScheduledFunctions(() => {
      vi.advanceTimersByTime(1);
    });

    expect(mockSend).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });

  it("only sends to confirmed subscribers, not pending or unsubscribed", async () => {
    vi.useFakeTimers();
    mockSend.mockReset();
    mockSend.mockResolvedValue({ data: { id: "test-id" }, error: null });
    process.env.RESEND_API_KEY = "re_test_key";
    process.env.SITE_URL = "https://ginevrarenier.com";

    const t = convexTest(schema, modules);

    await t.run(async (ctx) => {
      await ctx.db.insert("subscribers", {
        email: "confirmed@example.com",
        locale: "en",
        status: "confirmed",
        consentTimestamp: 1000,
        confirmationToken: "tok-confirmed",
        confirmedAt: 2000,
      });
      await ctx.db.insert("subscribers", {
        email: "pending@example.com",
        locale: "en",
        status: "pending",
        consentTimestamp: 1000,
        confirmationToken: "tok-pending",
      });
      await ctx.db.insert("subscribers", {
        email: "unsub@example.com",
        locale: "en",
        status: "unsubscribed",
        consentTimestamp: 1000,
        confirmationToken: "tok-unsub",
        unsubscribedAt: 3000,
      });
    });

    const projectId = await t.run(async (ctx) =>
      ctx.db.insert("projects", {
        slug: "filter-test",
        title: { en: "Filter Test", it: "Test Filtro" },
        subtitle: { en: "", it: "" },
        description: { en: "", it: "" },
        tagline: { en: "", it: "" },
        order: 0,
        published: false,
      })
    );

    const asAdmin = t.withIdentity({ name: "Admin" });
    await asAdmin.mutation(api.projects.update, {
      id: projectId,
      published: true,
    });

    await t.finishAllScheduledFunctions(() => {
      vi.advanceTimersByTime(1);
    });

    expect(mockSend).toHaveBeenCalledTimes(1);
    expect(mockSend.mock.calls[0][0].to).toEqual(["confirmed@example.com"]);

    vi.useRealTimers();
  });

  it("sends email in each subscriber's stored locale", async () => {
    vi.useFakeTimers();
    mockSend.mockReset();
    mockSend.mockResolvedValue({ data: { id: "test-id" }, error: null });
    process.env.RESEND_API_KEY = "re_test_key";
    process.env.SITE_URL = "https://ginevrarenier.com";

    const t = convexTest(schema, modules);

    await t.run(async (ctx) => {
      await ctx.db.insert("subscribers", {
        email: "english@example.com",
        locale: "en",
        status: "confirmed",
        consentTimestamp: 1000,
        confirmationToken: "tok-en",
        confirmedAt: 2000,
      });
      await ctx.db.insert("subscribers", {
        email: "italian@example.com",
        locale: "it",
        status: "confirmed",
        consentTimestamp: 1000,
        confirmationToken: "tok-it",
        confirmedAt: 2000,
      });
    });

    const projectId = await t.run(async (ctx) =>
      ctx.db.insert("projects", {
        slug: "locale-test",
        title: { en: "English Title", it: "Titolo Italiano" },
        subtitle: { en: "", it: "" },
        description: { en: "English desc", it: "Desc italiana" },
        tagline: { en: "", it: "" },
        order: 0,
        published: false,
      })
    );

    const asAdmin = t.withIdentity({ name: "Admin" });
    await asAdmin.mutation(api.projects.update, {
      id: projectId,
      published: true,
    });

    await t.finishAllScheduledFunctions(() => {
      vi.advanceTimersByTime(1);
    });

    expect(mockSend).toHaveBeenCalledTimes(2);

    const calls = mockSend.mock.calls.map(
      (c: Record<string, unknown>[]) => c[0]
    );
    const enCall = calls.find(
      (c: Record<string, unknown>) =>
        (c.to as string[])[0] === "english@example.com"
    );
    const itCall = calls.find(
      (c: Record<string, unknown>) =>
        (c.to as string[])[0] === "italian@example.com"
    );

    expect(enCall?.subject).toBe("New project: English Title");
    expect(enCall?.html).toContain("English Title");
    expect(enCall?.html).toContain("English desc");

    expect(itCall?.subject).toBe("Nuovo progetto: Titolo Italiano");
    expect(itCall?.html).toContain("Titolo Italiano");
    expect(itCall?.html).toContain("Desc italiana");

    vi.useRealTimers();
  });

  it("completes without error when there are no confirmed subscribers", async () => {
    vi.useFakeTimers();
    mockSend.mockReset();
    process.env.RESEND_API_KEY = "re_test_key";
    process.env.SITE_URL = "https://ginevrarenier.com";

    const t = convexTest(schema, modules);

    const projectId = await t.run(async (ctx) =>
      ctx.db.insert("projects", {
        slug: "no-subscribers",
        title: { en: "Lonely Project", it: "Progetto Solitario" },
        subtitle: { en: "", it: "" },
        description: { en: "", it: "" },
        tagline: { en: "", it: "" },
        order: 0,
        published: false,
      })
    );

    const asAdmin = t.withIdentity({ name: "Admin" });
    await asAdmin.mutation(api.projects.update, {
      id: projectId,
      published: true,
    });

    await t.finishAllScheduledFunctions(() => {
      vi.advanceTimersByTime(1);
    });

    expect(mockSend).not.toHaveBeenCalled();

    vi.useRealTimers();
  });

  it("includes recent blog posts and unsubscribe link in email", async () => {
    vi.useFakeTimers();
    mockSend.mockReset();
    mockSend.mockResolvedValue({ data: { id: "test-id" }, error: null });
    process.env.RESEND_API_KEY = "re_test_key";
    process.env.SITE_URL = "https://ginevrarenier.com";

    const t = convexTest(schema, modules);

    await t.run(async (ctx) => {
      await ctx.db.insert("subscribers", {
        email: "reader@example.com",
        locale: "en",
        status: "confirmed",
        consentTimestamp: 1000,
        confirmationToken: "unsub-token-abc",
        confirmedAt: 2000,
      });

      await ctx.db.insert("blogPosts", {
        slug: "recent-post",
        title: { en: "A Reflection", it: "Una Riflessione" },
        excerpt: { en: "", it: "" },
        content: { en: "[]", it: "[]" },
        published: true,
        publishedAt: 5000,
      });

      await ctx.db.insert("blogPosts", {
        slug: "older-post",
        title: { en: "Older Thoughts", it: "Pensieri Vecchi" },
        excerpt: { en: "", it: "" },
        content: { en: "[]", it: "[]" },
        published: true,
        publishedAt: 3000,
      });
    });

    const projectId = await t.run(async (ctx) =>
      ctx.db.insert("projects", {
        slug: "content-test",
        title: { en: "Content Test", it: "Test Contenuto" },
        subtitle: { en: "", it: "" },
        description: { en: "A project description", it: "Descrizione" },
        tagline: { en: "", it: "" },
        coverImageUrl: "https://cdn.example.com/cover.jpg",
        order: 0,
        published: false,
      })
    );

    const asAdmin = t.withIdentity({ name: "Admin" });
    await asAdmin.mutation(api.projects.update, {
      id: projectId,
      published: true,
    });

    await t.finishAllScheduledFunctions(() => {
      vi.advanceTimersByTime(1);
    });

    expect(mockSend).toHaveBeenCalledTimes(1);
    const html = mockSend.mock.calls[0][0].html as string;

    expect(html).toContain("Content Test");
    expect(html).toContain("A project description");
    expect(html).toContain("https://cdn.example.com/cover.jpg");
    expect(html).toContain("/en/work/content-test");

    expect(html).toContain("A Reflection");
    expect(html).toContain("/en/reflections/recent-post");
    expect(html).toContain("Older Thoughts");
    expect(html).toContain("/en/reflections/older-post");

    expect(html).toContain("/unsubscribe?token=unsub-token-abc");

    vi.useRealTimers();
  });
});
