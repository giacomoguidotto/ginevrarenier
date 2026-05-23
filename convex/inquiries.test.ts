// @vitest-environment edge-runtime
/// <reference types="vite/client" />

import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

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
