import { describe, expect, it } from "vitest";
import { pageHasStaleFields, staleCountByLocale } from "./staleness-queries";

describe("staleCountByLocale", () => {
  it("counts stale fields per locale", () => {
    const staleFields = [
      { section: "hero", field: "title", locale: "it" },
      { section: "hero", field: "subtitle", locale: "it" },
      { section: "intro", field: "bio", locale: "en" },
    ];
    const result = staleCountByLocale(staleFields);
    expect(result.get("it")).toBe(2);
    expect(result.get("en")).toBe(1);
  });

  it("returns empty map when no stale fields", () => {
    expect(staleCountByLocale([])).toEqual(new Map());
  });
});

describe("pageHasStaleFields", () => {
  it("returns true when a page section has stale fields in the given locale", () => {
    const staleFields = [
      { section: "hero", field: "title", locale: "it" },
      { section: "essence.hero", field: "bio", locale: "it" },
    ];
    const pageSections = new Map([["hero", "Hero"]]);
    expect(pageHasStaleFields(staleFields, pageSections, "it")).toBe(true);
  });

  it("returns false when no page sections have stale fields", () => {
    const staleFields = [
      { section: "essence.hero", field: "bio", locale: "it" },
    ];
    const pageSections = new Map([["hero", "Hero"]]);
    expect(pageHasStaleFields(staleFields, pageSections, "it")).toBe(false);
  });

  it("returns false when stale fields exist but in a different locale", () => {
    const staleFields = [{ section: "hero", field: "title", locale: "en" }];
    const pageSections = new Map([["hero", "Hero"]]);
    expect(pageHasStaleFields(staleFields, pageSections, "it")).toBe(false);
  });

  it("returns false when page has no registered sections", () => {
    const staleFields = [{ section: "hero", field: "title", locale: "it" }];
    expect(pageHasStaleFields(staleFields, new Map(), "it")).toBe(false);
  });
});
