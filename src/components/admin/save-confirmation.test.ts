import { describe, expect, it } from "vitest";
import type { TextEdit } from "./draft-buffer";
import {
  formatEditLabel,
  getUndismissedStaleFields,
} from "./save-confirmation";

describe("formatEditLabel", () => {
  it("resolves section name to registered label", () => {
    const labels = new Map([["hero", "Hero Section"]]);
    expect(formatEditLabel({ section: "hero", field: "title" }, labels)).toBe(
      "Hero Section / title"
    );
  });

  it("falls back to raw section name when not in map", () => {
    const labels = new Map<string, string>();
    expect(
      formatEditLabel({ section: "unknown-section", field: "body" }, labels)
    ).toBe("unknown-section / body");
  });

  it("resolves entity section to registered entity label", () => {
    const labels = new Map([["project:abc123", "Project: Solstice"]]);
    expect(
      formatEditLabel({ section: "project:abc123", field: "title" }, labels)
    ).toBe("Project: Solstice / title");
  });

  it("keeps semantic field prefixes (no digits)", () => {
    const labels = new Map([["essence.achievements", "Essence: Achievements"]]);
    expect(
      formatEditLabel(
        { section: "essence.achievements", field: "years.title" },
        labels
      )
    ).toBe("Essence: Achievements / years.title");
  });
});

function edit(section: string, field: string, locale: string): TextEdit {
  return { section, field, locale, newValue: "v", oldValue: undefined };
}

describe("getUndismissedStaleFields", () => {
  it("returns fields edited in one locale but not the other", () => {
    const stale = getUndismissedStaleFields({
      textEdits: [edit("hero", "title", "en")],
      dismissals: [],
      autoTranslations: [],
    });
    expect(stale).toEqual([{ section: "hero", field: "title", locale: "it" }]);
  });

  it("returns nothing when both locales are edited", () => {
    const stale = getUndismissedStaleFields({
      textEdits: [edit("hero", "title", "en"), edit("hero", "title", "it")],
      dismissals: [],
      autoTranslations: [],
    });
    expect(stale).toHaveLength(0);
  });

  it("excludes dismissed fields from stale count", () => {
    const stale = getUndismissedStaleFields({
      textEdits: [edit("hero", "title", "en")],
      dismissals: [{ section: "hero", field: "title", locale: "it" }],
      autoTranslations: [],
    });
    expect(stale).toHaveLength(0);
  });

  it("excludes auto-translated fields from stale count", () => {
    const stale = getUndismissedStaleFields({
      textEdits: [edit("hero", "title", "en")],
      dismissals: [],
      autoTranslations: [{ section: "hero", field: "title", locale: "it" }],
    });
    expect(stale).toHaveLength(0);
  });

  it("returns only undismissed stale fields among a mix", () => {
    const stale = getUndismissedStaleFields({
      textEdits: [
        edit("hero", "title", "en"),
        edit("hero", "subtitle", "en"),
        edit("essence", "heading", "it"),
      ],
      dismissals: [{ section: "hero", field: "title", locale: "it" }],
      autoTranslations: [],
    });
    expect(stale).toContainEqual({
      section: "hero",
      field: "subtitle",
      locale: "it",
    });
    expect(stale).toContainEqual({
      section: "essence",
      field: "heading",
      locale: "en",
    });
    expect(stale).toHaveLength(2);
  });
});
