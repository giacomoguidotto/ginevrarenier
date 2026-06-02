import { describe, expect, it } from "vitest";
import { confirmCopy, resolveConfirmLocale } from "./confirm-copy";

describe("confirmation page locale copy", () => {
  it("prefers the subscriber locale returned by confirmation", () => {
    expect(resolveConfirmLocale("it", "en")).toBe("it");
  });

  it("uses the requested locale when the token result has no locale", () => {
    expect(resolveConfirmLocale(null, "it")).toBe("it");
  });

  it("falls back to English for unknown locales", () => {
    expect(resolveConfirmLocale("fr", "de")).toBe("en");
  });

  it("has Italian success copy", () => {
    expect(confirmCopy.it.success.title).toBe("Ci sei.");
    expect(confirmCopy.it.success.body).toContain("Grazie");
  });
});
