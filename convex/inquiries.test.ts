// @vitest-environment edge-runtime
/// <reference types="vite/client" />

import { convexTest } from "convex-test";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const mockSend = vi.fn();
vi.mock("resend", () => ({
  Resend: class {
    emails = { send: mockSend };
  },
}));

const modules = import.meta.glob("./**/*.ts");

describe("inquiries.submit", () => {
  it("persists a valid inquiry with pending status and zero attempts", async () => {
    const t = convexTest(schema, modules);

    await t.mutation(api.inquiries.submit, {
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
      t.mutation(api.inquiries.submit, {
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
      t.mutation(api.inquiries.submit, {
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
      t.mutation(api.inquiries.submit, {
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
      t.mutation(api.inquiries.submit, {
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

    await t.mutation(api.inquiries.submit, base);
    await t.mutation(api.inquiries.submit, base);
    await t.mutation(api.inquiries.submit, base);

    await expect(t.mutation(api.inquiries.submit, base)).rejects.toThrow();
  });

  it("counts per-email limits independently per email address", async () => {
    const t = convexTest(schema, modules);
    const base = {
      name: "Ada Lovelace",
      inquiryType: "collaboration" as const,
      message: "Hello",
    };

    await t.mutation(api.inquiries.submit, { ...base, email: "a@example.com" });
    await t.mutation(api.inquiries.submit, { ...base, email: "a@example.com" });
    await t.mutation(api.inquiries.submit, { ...base, email: "a@example.com" });

    await t.mutation(api.inquiries.submit, { ...base, email: "b@example.com" });
  });

  it("rejects when global submission count exceeds limit within 1 hour", async () => {
    const t = convexTest(schema, modules);
    const base = {
      name: "Ada Lovelace",
      inquiryType: "collaboration" as const,
      message: "Hello",
    };

    for (let i = 0; i < 20; i++) {
      await t.mutation(api.inquiries.submit, {
        ...base,
        email: `user${i}@example.com`,
      });
    }

    await expect(
      t.mutation(api.inquiries.submit, {
        ...base,
        email: "user20@example.com",
      })
    ).rejects.toThrow();
  });

  it("returns a generic error that does not reveal specific limits", async () => {
    const t = convexTest(schema, modules);
    const base = {
      name: "Ada Lovelace",
      email: "ada@example.com",
      inquiryType: "collaboration" as const,
      message: "Hello",
    };

    await t.mutation(api.inquiries.submit, base);
    await t.mutation(api.inquiries.submit, base);
    await t.mutation(api.inquiries.submit, base);

    const error: Error = await t.mutation(api.inquiries.submit, base).then(
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

    await t.mutation(api.inquiries.submit, {
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

    await t.mutation(api.inquiries.submit, {
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

    await t.mutation(api.inquiries.submit, {
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

    await t.mutation(api.inquiries.submit, {
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
      from: "noreply@ginevrarenier.com",
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
  });
});
