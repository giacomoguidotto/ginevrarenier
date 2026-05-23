// @vitest-environment edge-runtime

import { describe, expect, it } from "vitest";
import { inquirySchema } from "./inquiry";

const valid = {
  name: "Ada Lovelace",
  email: "ada@example.com",
  inquiryType: "collaboration" as const,
  message: "I'd love to collaborate on a project.",
};

describe("inquirySchema", () => {
  it("accepts a valid inquiry", () => {
    const result = inquirySchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("rejects an empty name", () => {
    const result = inquirySchema.safeParse({ ...valid, name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid email", () => {
    const result = inquirySchema.safeParse({ ...valid, email: "not-an-email" });
    expect(result.success).toBe(false);
  });

  it("rejects a missing inquiry type", () => {
    const result = inquirySchema.safeParse({
      ...valid,
      inquiryType: undefined,
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid inquiry type", () => {
    const result = inquirySchema.safeParse({
      ...valid,
      inquiryType: "wedding",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an empty message", () => {
    const result = inquirySchema.safeParse({ ...valid, message: "" });
    expect(result.success).toBe(false);
  });
});
