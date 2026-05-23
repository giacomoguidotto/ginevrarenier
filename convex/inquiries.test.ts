// @vitest-environment edge-runtime
/// <reference types="vite/client" />

import { convexTest } from "convex-test";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api, internal } from "./_generated/api";
import schema from "./schema";

const mockSend = vi.fn();
vi.mock("resend", () => ({
  Resend: class {
    emails = { send: mockSend };
  },
}));

const modules = import.meta.glob("./**/*.{ts,tsx}");

describe("insertInquiry", () => {
  it("persists a valid inquiry with pending status and zero attempts", async () => {
    const t = convexTest(schema, modules);

    await t.mutation(internal.inquiries.insertInquiry, {
      name: "Ada Lovelace",
      email: "ada@example.com",
      inquiryType: "collaboration",
      message: "I'd love to collaborate on a project.",
    });

    const inquiry = await t.run(
      async (ctx) => await ctx.db.query("inquiries").take(1)
    );

    expect(inquiry).toHaveLength(1);
    expect(inquiry[0]).toMatchObject({
      name: "Ada Lovelace",
      email: "ada@example.com",
      inquiryType: "collaboration",
      message: "I'd love to collaborate on a project.",
      emailStatus: "pending",
      attempts: 0,
    });
  });

  it("rejects an empty name", async () => {
    const t = convexTest(schema, modules);

    await expect(
      t.mutation(internal.inquiries.insertInquiry, {
        name: "",
        email: "ada@example.com",
        inquiryType: "commission",
        message: "Hello",
      })
    ).rejects.toThrow();
  });

  it("rejects an empty message", async () => {
    const t = convexTest(schema, modules);

    await expect(
      t.mutation(internal.inquiries.insertInquiry, {
        name: "Ada Lovelace",
        email: "ada@example.com",
        inquiryType: "press",
        message: "",
      })
    ).rejects.toThrow();
  });

  it("rejects an invalid email format", async () => {
    const t = convexTest(schema, modules);

    await expect(
      t.mutation(internal.inquiries.insertInquiry, {
        name: "Ada Lovelace",
        email: "not-an-email",
        inquiryType: "collaboration",
        message: "Hello",
      })
    ).rejects.toThrow();
  });

  it("rejects an invalid inquiry type", async () => {
    const t = convexTest(schema, modules);

    await expect(
      t.mutation(internal.inquiries.insertInquiry, {
        name: "Ada Lovelace",
        email: "ada@example.com",
        // @ts-expect-error testing invalid value
        inquiryType: "wedding",
        message: "Hello",
      })
    ).rejects.toThrow();
  });

  it("rejects a 4th submission from the same email within 24 hours", async () => {
    const t = convexTest(schema, modules);
    const base = {
      name: "Ada Lovelace",
      email: "ada@example.com",
      inquiryType: "collaboration" as const,
      message: "Hello",
    };

    await t.mutation(internal.inquiries.insertInquiry, base);
    await t.mutation(internal.inquiries.insertInquiry, base);
    await t.mutation(internal.inquiries.insertInquiry, base);

    await expect(
      t.mutation(internal.inquiries.insertInquiry, base)
    ).rejects.toThrow();
  });

  it("counts per-email limits independently per email address", async () => {
    const t = convexTest(schema, modules);
    const base = {
      name: "Ada Lovelace",
      inquiryType: "collaboration" as const,
      message: "Hello",
    };

    await t.mutation(internal.inquiries.insertInquiry, {
      ...base,
      email: "a@example.com",
    });
    await t.mutation(internal.inquiries.insertInquiry, {
      ...base,
      email: "a@example.com",
    });
    await t.mutation(internal.inquiries.insertInquiry, {
      ...base,
      email: "a@example.com",
    });

    await t.mutation(internal.inquiries.insertInquiry, {
      ...base,
      email: "b@example.com",
    });
  });

  it("rejects when global submission count exceeds limit within 1 hour", async () => {
    const t = convexTest(schema, modules);
    const base = {
      name: "Ada Lovelace",
      inquiryType: "collaboration" as const,
      message: "Hello",
    };

    for (let i = 0; i < 20; i++) {
      await t.mutation(internal.inquiries.insertInquiry, {
        ...base,
        email: `user${i}@example.com`,
      });
    }

    await expect(
      t.mutation(internal.inquiries.insertInquiry, {
        ...base,
        email: "user20@example.com",
      })
    ).rejects.toThrow();
  });

  it("silently discards submission when honeypot field is non-empty", async () => {
    const t = convexTest(schema, modules);

    await t.mutation(internal.inquiries.insertInquiry, {
      name: "Spambot",
      email: "spam@example.com",
      inquiryType: "collaboration",
      message: "Buy cheap watches",
      website: "http://spam.example.com",
    });

    const inquiries = await t.run(
      async (ctx) => await ctx.db.query("inquiries").take(1)
    );
    expect(inquiries).toHaveLength(0);
  });

  it("persists submission when honeypot field is empty", async () => {
    const t = convexTest(schema, modules);

    await t.mutation(internal.inquiries.insertInquiry, {
      name: "Ada Lovelace",
      email: "ada@example.com",
      inquiryType: "collaboration",
      message: "Genuine inquiry",
      website: "",
    });

    const inquiries = await t.run(
      async (ctx) => await ctx.db.query("inquiries").take(1)
    );
    expect(inquiries).toHaveLength(1);
    expect(inquiries[0]).toMatchObject({
      name: "Ada Lovelace",
      email: "ada@example.com",
    });
  });

  it("returns a generic error that does not reveal specific limits", async () => {
    const t = convexTest(schema, modules);
    const base = {
      name: "Ada Lovelace",
      email: "ada@example.com",
      inquiryType: "collaboration" as const,
      message: "Hello",
    };

    await t.mutation(internal.inquiries.insertInquiry, base);
    await t.mutation(internal.inquiries.insertInquiry, base);
    await t.mutation(internal.inquiries.insertInquiry, base);

    const error: Error = await t
      .mutation(internal.inquiries.insertInquiry, base)
      .then(
        () => expect.fail("Should have thrown"),
        (e: Error) => e
      );
    expect(error.message).not.toContain("3");
    expect(error.message).not.toContain("24");
    expect(error.message).not.toContain("20");
    expect(error.message).toContain("try again later");
  });
});

describe("sendInquiryEmail", () => {
  beforeEach(() => {
    mockSend.mockReset();
    process.env.RESEND_API_KEY = "re_test_key";
    process.env.ARTIST_EMAIL = "artist@test.com";
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("sends email and marks inquiry as sent on success", async () => {
    mockSend.mockResolvedValue({ data: { id: "test-id" }, error: null });
    vi.useFakeTimers();
    const t = convexTest(schema, modules);

    await t.mutation(internal.inquiries.insertInquiry, {
      name: "Ada Lovelace",
      email: "ada@example.com",
      inquiryType: "collaboration",
      message: "I'd love to collaborate on a project.",
    });

    await t.finishAllScheduledFunctions(() => {
      vi.advanceTimersByTime(1);
    });
    const inquiry = await t.run(async (ctx) => {
      const rows = await ctx.db.query("inquiries").take(1);
      return rows[0];
    });

    expect(inquiry.emailStatus).toBe("sent");
    expect(mockSend).toHaveBeenCalled();
  });

  it("retries with exponential backoff on failure", async () => {
    mockSend
      .mockResolvedValueOnce({ data: null, error: { message: "Send failed" } })
      .mockResolvedValueOnce({ data: { id: "test-id" }, error: null });
    vi.useFakeTimers();
    const t = convexTest(schema, modules);

    await t.mutation(internal.inquiries.insertInquiry, {
      name: "Ada Lovelace",
      email: "ada@example.com",
      inquiryType: "commission",
      message: "Commission request.",
    });

    await t.finishAllScheduledFunctions(() => {
      vi.advanceTimersByTime(30_000);
    });
    const inquiry = await t.run(async (ctx) => {
      const rows = await ctx.db.query("inquiries").take(1);
      return rows[0];
    });

    expect(inquiry.emailStatus).toBe("sent");
    expect(inquiry.attempts).toBe(1);
  });

  it("marks as failed after exhausting all retries", async () => {
    mockSend.mockResolvedValue({
      data: null,
      error: { message: "Send failed" },
    });
    vi.useFakeTimers();
    const t = convexTest(schema, modules);

    await t.mutation(internal.inquiries.insertInquiry, {
      name: "Ada Lovelace",
      email: "ada@example.com",
      inquiryType: "exhibition",
      message: "Gallery opening.",
    });

    await t.finishAllScheduledFunctions(() => {
      vi.advanceTimersByTime(480_000);
    });
    const inquiry = await t.run(async (ctx) => {
      const rows = await ctx.db.query("inquiries").take(1);
      return rows[0];
    });

    expect(inquiry.emailStatus).toBe("failed");
    expect(inquiry.attempts).toBe(4);
  });

  it("sends email with correct format", async () => {
    mockSend.mockResolvedValue({ data: { id: "test-id" }, error: null });
    vi.useFakeTimers();
    const t = convexTest(schema, modules);

    await t.mutation(internal.inquiries.insertInquiry, {
      name: "Ada Lovelace",
      email: "ada@example.com",
      inquiryType: "press",
      message: "Press inquiry about your work.",
    });

    await t.finishAllScheduledFunctions(() => {
      vi.advanceTimersByTime(1);
    });

    const call = mockSend.mock.calls.find((c) =>
      c[0]?.subject?.includes("press")
    );
    expect(call).toBeDefined();
    expect(call?.[0]).toMatchObject({
      from: "Ginevra Renier Studio <noreply@ginevrarenier.com>",
      to: ["artist@test.com"],
      replyTo: "ada@example.com",
      subject: "New inquiry: press from Ada Lovelace",
    });
    expect(call?.[0]?.text).toContain("Name: Ada Lovelace");
    expect(call?.[0]?.text).toContain("Email: ada@example.com");
    expect(call?.[0]?.text).toContain("Type: press");
    expect(call?.[0]?.text).toContain(
      "Message: Press inquiry about your work."
    );
    expect(call?.[0]?.html).toBeDefined();
    expect(call?.[0]?.html).toContain("Ada Lovelace");
    expect(call?.[0]?.html).toContain("GINEVRA RENIER");
  });
});

describe("Turnstile verification", () => {
  beforeEach(() => {
    process.env.TURNSTILE_SECRET_KEY = "test-secret-key";
    mockSend.mockReset();
    mockSend.mockResolvedValue({ data: { id: "test-id" }, error: null });
    process.env.RESEND_API_KEY = "re_test_key";
    process.env.ARTIST_EMAIL = "artist@test.com";
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("allows submission when Turnstile verification succeeds", async () => {
    vi.useFakeTimers();
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({ success: true })
    );

    const t = convexTest(schema, modules);

    await t.action(api.inquiries.submit, {
      name: "Ada Lovelace",
      email: "ada@example.com",
      inquiryType: "collaboration",
      message: "Hello",
      turnstileToken: "valid-token",
    });

    await t.finishAllScheduledFunctions(() => {
      vi.advanceTimersByTime(1);
    });

    const inquiry = await t.run(async (ctx) => {
      const rows = await ctx.db.query("inquiries").take(1);
      return rows[0];
    });

    expect(inquiry).toMatchObject({
      name: "Ada Lovelace",
      email: "ada@example.com",
      inquiryType: "collaboration",
      message: "Hello",
      emailStatus: "sent",
    });
  });

  it("sends token and secret to Cloudflare siteverify endpoint", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(Response.json({ success: true }));

    const t = convexTest(schema, modules);

    await t.action(api.inquiries.submit, {
      name: "Ada Lovelace",
      email: "ada@example.com",
      inquiryType: "collaboration",
      message: "Hello",
      turnstileToken: "my-token-123",
    });

    expect(fetchSpy).toHaveBeenCalledOnce();
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify"
    );
    expect(init?.method).toBe("POST");
    const body = new URLSearchParams(init?.body as string);
    expect(body.get("secret")).toBe("test-secret-key");
    expect(body.get("response")).toBe("my-token-123");
  });

  it("rejects submission when Turnstile verification fails", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({ success: false })
    );

    const t = convexTest(schema, modules);

    await expect(
      t.action(api.inquiries.submit, {
        name: "Ada Lovelace",
        email: "ada@example.com",
        inquiryType: "collaboration",
        message: "Hello",
        turnstileToken: "invalid-token",
      })
    ).rejects.toThrow("Verification failed");

    const inquiries = await t.run(
      async (ctx) => await ctx.db.query("inquiries").take(1)
    );
    expect(inquiries).toHaveLength(0);
  });

  it("rejects submission when token is missing but secret is configured", async () => {
    const t = convexTest(schema, modules);

    await expect(
      t.action(api.inquiries.submit, {
        name: "Ada Lovelace",
        email: "ada@example.com",
        inquiryType: "collaboration",
        message: "Hello",
      })
    ).rejects.toThrow("Verification failed");
  });

  it("skips verification when secret key is not configured", async () => {
    delete process.env.TURNSTILE_SECRET_KEY;
    vi.useFakeTimers();

    const t = convexTest(schema, modules);

    await t.action(api.inquiries.submit, {
      name: "Ada Lovelace",
      email: "ada@example.com",
      inquiryType: "collaboration",
      message: "Hello",
    });

    await t.finishAllScheduledFunctions(() => {
      vi.advanceTimersByTime(1);
    });

    const inquiry = await t.run(async (ctx) => {
      const rows = await ctx.db.query("inquiries").take(1);
      return rows[0];
    });

    expect(inquiry).toMatchObject({
      name: "Ada Lovelace",
      emailStatus: "sent",
    });
  });
});
