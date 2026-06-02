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

const modules = import.meta.glob("./**/*.{ts,tsx}");

describe("subscribers.subscribe", () => {
  it("rejects an invalid email format", async () => {
    const t = convexTest(schema, modules);

    await expect(
      t.mutation(api.subscribers.subscribe, {
        email: "not-an-email",
        locale: "it",
        consentTimestamp: Date.now(),
      })
    ).rejects.toThrow("Invalid email");
  });

  it("creates a pending subscriber with token when given a valid email", async () => {
    const t = convexTest(schema, modules);

    const result = await t.mutation(api.subscribers.subscribe, {
      email: "visitor@example.com",
      locale: "en",
      consentTimestamp: Date.now(),
    });

    expect(result).toMatchObject({ status: "pending" });

    const subscriber = await t.run(async (ctx) => {
      const rows = await ctx.db.query("subscribers").take(1);
      return rows[0];
    });

    expect(subscriber).toMatchObject({
      email: "visitor@example.com",
      locale: "en",
      status: "pending",
    });
    expect(subscriber.confirmationToken).toBeDefined();
    expect(subscriber.confirmationToken.length).toBeGreaterThan(20);
  });

  it("re-subscribing when pending resends confirmation without creating duplicate", async () => {
    vi.useFakeTimers();
    mockSend.mockReset();
    mockSend.mockResolvedValue({ data: { id: "test-id" }, error: null });
    process.env.RESEND_API_KEY = "re_test_key";
    process.env.SITE_URL = "https://ginevrarenier.com";

    const t = convexTest(schema, modules);

    await t.mutation(api.subscribers.subscribe, {
      email: "visitor@example.com",
      locale: "en",
      consentTimestamp: 1000,
    });

    await t.finishAllScheduledFunctions(() => {
      vi.advanceTimersByTime(1);
    });

    const tokenBefore = await t.run(async (ctx) => {
      const rows = await ctx.db.query("subscribers").take(1);
      return rows[0]?.confirmationToken;
    });

    const result = await t.mutation(api.subscribers.subscribe, {
      email: "visitor@example.com",
      locale: "en",
      consentTimestamp: 2000,
    });

    expect(result).toMatchObject({ status: "pending" });

    await t.finishAllScheduledFunctions(() => {
      vi.advanceTimersByTime(1);
    });

    const subscribers = await t.run(
      async (ctx) => await ctx.db.query("subscribers").take(10)
    );
    expect(subscribers).toHaveLength(1);
    expect(subscribers[0].confirmationToken).not.toBe(tokenBefore);
    expect(mockSend.mock.calls.length).toBeGreaterThanOrEqual(2);

    vi.useRealTimers();
  });

  it("re-subscribing when confirmed is a no-op", async () => {
    const t = convexTest(schema, modules);

    await t.run(async (ctx) => {
      await ctx.db.insert("subscribers", {
        email: "visitor@example.com",
        locale: "en",
        status: "confirmed",
        consentTimestamp: 1000,
        confirmationToken: "old-token",
        confirmedAt: 2000,
      });
    });

    const result = await t.mutation(api.subscribers.subscribe, {
      email: "visitor@example.com",
      locale: "en",
      consentTimestamp: 3000,
    });

    expect(result).toMatchObject({ status: "already_confirmed" });
  });

  it("re-subscribing when unsubscribed resets to pending with new token", async () => {
    vi.useFakeTimers();
    mockSend.mockResolvedValue({ data: { id: "test-id" }, error: null });
    process.env.RESEND_API_KEY = "re_test_key";
    process.env.SITE_URL = "https://ginevrarenier.com";

    const t = convexTest(schema, modules);

    await t.run(async (ctx) => {
      await ctx.db.insert("subscribers", {
        email: "visitor@example.com",
        locale: "en",
        status: "unsubscribed",
        consentTimestamp: 1000,
        confirmationToken: "old-token",
        unsubscribedAt: 2000,
      });
    });

    const result = await t.mutation(api.subscribers.subscribe, {
      email: "visitor@example.com",
      locale: "it",
      consentTimestamp: 3000,
    });

    expect(result).toMatchObject({ status: "pending" });

    await t.finishAllScheduledFunctions(() => {
      vi.advanceTimersByTime(1);
    });

    const subscriber = await t.run(async (ctx) => {
      const rows = await ctx.db.query("subscribers").take(1);
      return rows[0];
    });

    expect(subscriber.status).toBe("pending");
    expect(subscriber.confirmationToken).not.toBe("old-token");
    expect(subscriber.unsubscribedAt).toBeUndefined();
    expect(mockSend).toHaveBeenCalled();

    vi.useRealTimers();
  });

  it("schedules confirmation email action after subscribing", async () => {
    vi.useFakeTimers();
    mockSend.mockResolvedValue({ data: { id: "test-id" }, error: null });
    process.env.RESEND_API_KEY = "re_test_key";
    process.env.SITE_URL = "https://ginevrarenier.com";

    const t = convexTest(schema, modules);

    await t.mutation(api.subscribers.subscribe, {
      email: "visitor@example.com",
      locale: "en",
      consentTimestamp: Date.now(),
    });

    await t.finishAllScheduledFunctions(() => {
      vi.advanceTimersByTime(1);
    });

    expect(mockSend).toHaveBeenCalled();
    vi.useRealTimers();
  });
});

describe("subscribers.confirm", () => {
  it("transitions pending subscriber to confirmed with timestamp", async () => {
    const t = convexTest(schema, modules);

    const token = "test-confirmation-token-abc123";
    await t.run(async (ctx) => {
      await ctx.db.insert("subscribers", {
        email: "visitor@example.com",
        locale: "en",
        status: "pending",
        consentTimestamp: 1000,
        confirmationToken: token,
      });
    });

    const result = await t.mutation(api.subscribers.confirm, { token });

    expect(result).toMatchObject({ status: "confirmed", locale: "en" });

    const subscriber = await t.run(async (ctx) => {
      const rows = await ctx.db.query("subscribers").take(1);
      return rows[0];
    });

    expect(subscriber.status).toBe("confirmed");
    expect(subscriber.confirmedAt).toBeTypeOf("number");
  });

  it("returns invalid_token for unknown token", async () => {
    const t = convexTest(schema, modules);

    const result = await t.mutation(api.subscribers.confirm, {
      token: "nonexistent-token",
    });

    expect(result).toMatchObject({ status: "invalid_token" });
  });

  it("returns the stored subscriber locale when confirming", async () => {
    const t = convexTest(schema, modules);

    const token = "test-italian-token";
    await t.run(async (ctx) => {
      await ctx.db.insert("subscribers", {
        email: "visitor@example.com",
        locale: "it",
        status: "pending",
        consentTimestamp: 1000,
        confirmationToken: token,
      });
    });

    const result = await t.mutation(api.subscribers.confirm, { token });

    expect(result).toMatchObject({ status: "confirmed", locale: "it" });
  });

  it("returns already_confirmed when confirming twice", async () => {
    const t = convexTest(schema, modules);

    const token = "test-token";
    await t.run(async (ctx) => {
      await ctx.db.insert("subscribers", {
        email: "visitor@example.com",
        locale: "en",
        status: "confirmed",
        consentTimestamp: 1000,
        confirmationToken: token,
        confirmedAt: 2000,
      });
    });

    const result = await t.mutation(api.subscribers.confirm, { token });

    expect(result).toMatchObject({
      status: "already_confirmed",
      locale: "en",
    });
  });
});

describe("subscribers.sendConfirmation", () => {
  it("sends email with correct locale and confirm URL", async () => {
    vi.useFakeTimers();
    mockSend.mockReset();
    mockSend.mockResolvedValue({ data: { id: "test-id" }, error: null });
    process.env.RESEND_API_KEY = "re_test_key";
    process.env.SITE_URL = "https://ginevrarenier.com";

    const t = convexTest(schema, modules);

    await t.mutation(api.subscribers.subscribe, {
      email: "visitor@example.com",
      locale: "it",
      consentTimestamp: Date.now(),
    });

    await t.finishAllScheduledFunctions(() => {
      vi.advanceTimersByTime(1);
    });

    expect(mockSend).toHaveBeenCalledTimes(1);
    const call = mockSend.mock.calls[0][0];
    expect(call.from).toBe("Ginevra Renier <noreply@ginevrarenier.com>");
    expect(call.to).toEqual(["visitor@example.com"]);
    expect(call.subject).toBe("Conferma la tua iscrizione");
    expect(call.html).toContain("https://ginevrarenier.com/confirm?token=");
    expect(call.html).toContain("locale=it");

    vi.useRealTimers();
  });

  it("uses English subject for en locale", async () => {
    vi.useFakeTimers();
    mockSend.mockReset();
    mockSend.mockResolvedValue({ data: { id: "test-id" }, error: null });
    process.env.RESEND_API_KEY = "re_test_key";
    process.env.SITE_URL = "https://ginevrarenier.com";

    const t = convexTest(schema, modules);

    await t.mutation(api.subscribers.subscribe, {
      email: "english@example.com",
      locale: "en",
      consentTimestamp: Date.now(),
    });

    await t.finishAllScheduledFunctions(() => {
      vi.advanceTimersByTime(1);
    });

    const call = mockSend.mock.calls[0][0];
    expect(call.subject).toBe("Confirm your subscription");

    vi.useRealTimers();
  });
});

describe("subscribers.unsubscribe", () => {
  it("transitions subscriber to unsubscribed with timestamp", async () => {
    const t = convexTest(schema, modules);

    const token = "test-token";
    await t.run(async (ctx) => {
      await ctx.db.insert("subscribers", {
        email: "visitor@example.com",
        locale: "en",
        status: "confirmed",
        consentTimestamp: 1000,
        confirmationToken: token,
        confirmedAt: 2000,
      });
    });

    const result = await t.mutation(api.subscribers.unsubscribe, { token });

    expect(result).toMatchObject({ status: "unsubscribed" });

    const subscriber = await t.run(async (ctx) => {
      const rows = await ctx.db.query("subscribers").take(1);
      return rows[0];
    });

    expect(subscriber.status).toBe("unsubscribed");
    expect(subscriber.unsubscribedAt).toBeTypeOf("number");
  });

  it("returns invalid_token for unknown token", async () => {
    const t = convexTest(schema, modules);

    const result = await t.mutation(api.subscribers.unsubscribe, {
      token: "nonexistent-token",
    });

    expect(result).toMatchObject({ status: "invalid_token" });
  });
});
