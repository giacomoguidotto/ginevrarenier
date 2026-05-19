import { describe, expect, it } from "vitest";
import type { TextEdit } from "./draft-buffer";
import { createStalenessEngine } from "./staleness-engine";

describe("Staleness Engine", () => {
  it("marks a field as stale in the unedited locale", () => {
    const edits: TextEdit[] = [
      {
        section: "hero",
        field: "title",
        locale: "en",
        newValue: "Hello",
        oldValue: undefined,
      },
    ];
    const engine = createStalenessEngine(edits);

    expect(engine.isStale("hero", "title", "it")).toBe(true);
    expect(engine.isStale("hero", "title", "en")).toBe(false);
  });

  it("clears staleness when a field is edited in both locales", () => {
    const edits: TextEdit[] = [
      {
        section: "hero",
        field: "title",
        locale: "en",
        newValue: "Hello",
        oldValue: undefined,
      },
      {
        section: "hero",
        field: "title",
        locale: "it",
        newValue: "Ciao",
        oldValue: undefined,
      },
    ];
    const engine = createStalenessEngine(edits);

    expect(engine.isStale("hero", "title", "en")).toBe(false);
    expect(engine.isStale("hero", "title", "it")).toBe(false);
  });

  it("reports an unedited field as not stale", () => {
    const edits: TextEdit[] = [
      {
        section: "hero",
        field: "title",
        locale: "en",
        newValue: "Hello",
        oldValue: undefined,
      },
    ];
    const engine = createStalenessEngine(edits);

    expect(engine.isStale("hero", "subtitle", "en")).toBe(false);
    expect(engine.isStale("hero", "subtitle", "it")).toBe(false);
  });

  it("tracks multiple fields in the same section independently", () => {
    const edits: TextEdit[] = [
      {
        section: "hero",
        field: "title",
        locale: "en",
        newValue: "Hello",
        oldValue: undefined,
      },
      {
        section: "hero",
        field: "subtitle",
        locale: "it",
        newValue: "Sottotitolo",
        oldValue: undefined,
      },
    ];
    const engine = createStalenessEngine(edits);

    expect(engine.isStale("hero", "title", "it")).toBe(true);
    expect(engine.isStale("hero", "title", "en")).toBe(false);
    expect(engine.isStale("hero", "subtitle", "en")).toBe(true);
    expect(engine.isStale("hero", "subtitle", "it")).toBe(false);
  });

  it("tracks fields across different sections independently", () => {
    const edits: TextEdit[] = [
      {
        section: "hero",
        field: "title",
        locale: "en",
        newValue: "Hello",
        oldValue: undefined,
      },
      {
        section: "essence.achievements",
        field: "title",
        locale: "it",
        newValue: "Titolo",
        oldValue: undefined,
      },
    ];
    const engine = createStalenessEngine(edits);

    expect(engine.isStale("hero", "title", "it")).toBe(true);
    expect(engine.isStale("hero", "title", "en")).toBe(false);
    expect(engine.isStale("essence.achievements", "title", "en")).toBe(true);
    expect(engine.isStale("essence.achievements", "title", "it")).toBe(false);
  });

  it("reports nothing stale when there are no text edits", () => {
    const engine = createStalenessEngine([]);

    expect(engine.isStale("hero", "title", "en")).toBe(false);
    expect(engine.isStale("hero", "title", "it")).toBe(false);
  });

  it("returns all stale field-locale pairs", () => {
    const edits: TextEdit[] = [
      {
        section: "hero",
        field: "title",
        locale: "en",
        newValue: "Hello",
        oldValue: undefined,
      },
      {
        section: "hero",
        field: "subtitle",
        locale: "it",
        newValue: "Sottotitolo",
        oldValue: undefined,
      },
      {
        section: "hero",
        field: "description",
        locale: "en",
        newValue: "Desc",
        oldValue: undefined,
      },
      {
        section: "hero",
        field: "description",
        locale: "it",
        newValue: "Desc IT",
        oldValue: undefined,
      },
    ];
    const engine = createStalenessEngine(edits);
    const stale = engine.staleFields();

    expect(stale).toContainEqual({
      section: "hero",
      field: "title",
      locale: "it",
    });
    expect(stale).toContainEqual({
      section: "hero",
      field: "subtitle",
      locale: "en",
    });
    expect(stale).toHaveLength(2);
  });
});
