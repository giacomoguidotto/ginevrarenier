import { describe, expect, it } from "vitest";
import { createDraftBuffer } from "./draft-buffer";

describe("Draft Buffer", () => {
  it("reads back a written value", () => {
    const buffer = createDraftBuffer();
    buffer.write("hero", "title", "en", "Hello World");
    expect(buffer.read("hero", "title", "en")).toBe("Hello World");
  });

  it("returns undefined for unwritten fields", () => {
    const buffer = createDraftBuffer();
    expect(buffer.read("hero", "title", "en")).toBeUndefined();
  });

  it("reports no changes initially", () => {
    const buffer = createDraftBuffer();
    expect(buffer.hasChanges()).toBe(false);
  });

  it("reports changes after a write", () => {
    const buffer = createDraftBuffer();
    buffer.write("hero", "title", "en", "Hello");
    expect(buffer.hasChanges()).toBe(true);
  });

  it("discard clears all state", () => {
    const buffer = createDraftBuffer();
    buffer.write("hero", "title", "en", "Hello");
    buffer.write("hero", "subtitle", "it", "Ciao");
    buffer.discard();
    expect(buffer.hasChanges()).toBe(false);
    expect(buffer.read("hero", "title", "en")).toBeUndefined();
    expect(buffer.read("hero", "subtitle", "it")).toBeUndefined();
  });

  it("groups changes by section for save", () => {
    const buffer = createDraftBuffer();
    buffer.write("hero", "title", "en", "Hello");
    buffer.write("hero", "title", "it", "Ciao");
    buffer.write("hero", "subtitle", "en", "World");
    buffer.write("essence", "heading", "en", "About");

    const grouped = buffer.changes();
    expect(grouped).toEqual(
      new Map([
        [
          "hero",
          {
            title: { en: "Hello", it: "Ciao" },
            subtitle: { en: "World" },
          },
        ],
        ["essence", { heading: { en: "About" } }],
      ])
    );
  });

  it("changeSummary returns empty textEdits when no changes", () => {
    const buffer = createDraftBuffer();
    expect(buffer.changeSummary()).toEqual({ imageSwaps: [], textEdits: [] });
  });

  it("changeSummary returns text edits with section, field, locale, and newValue", () => {
    const buffer = createDraftBuffer();
    buffer.write("hero", "title", "en", "Hello");
    buffer.write("hero", "title", "it", "Ciao");
    buffer.write("essence", "heading", "en", "About");

    const summary = buffer.changeSummary();
    expect(summary.textEdits).toEqual(
      expect.arrayContaining([
        {
          section: "hero",
          field: "title",
          locale: "en",
          oldValue: undefined,
          newValue: "Hello",
        },
        {
          section: "hero",
          field: "title",
          locale: "it",
          oldValue: undefined,
          newValue: "Ciao",
        },
        {
          section: "essence",
          field: "heading",
          locale: "en",
          oldValue: undefined,
          newValue: "About",
        },
      ])
    );
    expect(summary.textEdits).toHaveLength(3);
  });

  it("changeSummary resolves old values via provided getter", () => {
    const buffer = createDraftBuffer();
    buffer.write("hero", "title", "en", "New Title");

    const getOriginal = (section: string, field: string, locale: string) => {
      if (section === "hero" && field === "title" && locale === "en") {
        return "Old Title";
      }
      return;
    };

    const summary = buffer.changeSummary(getOriginal);
    expect(summary.textEdits[0]).toEqual({
      section: "hero",
      field: "title",
      locale: "en",
      oldValue: "Old Title",
      newValue: "New Title",
    });
  });

  it("changeSummary produces single entry when same key written twice", () => {
    const buffer = createDraftBuffer();
    buffer.write("hero", "title", "en", "First");
    buffer.write("hero", "title", "en", "Second");

    const summary = buffer.changeSummary();
    expect(summary.textEdits).toHaveLength(1);
    expect(summary.textEdits[0].newValue).toBe("Second");
  });

  it("discard clears changeSummary", () => {
    const buffer = createDraftBuffer();
    buffer.write("hero", "title", "en", "Hello");
    buffer.discard();
    expect(buffer.changeSummary()).toEqual({ imageSwaps: [], textEdits: [] });
  });

  it("save extracts changes and clears state", () => {
    const buffer = createDraftBuffer();
    buffer.write("hero", "title", "en", "Hello");
    const before = buffer.changes();
    expect(before.size).toBe(1);
    buffer.discard();
    expect(buffer.hasChanges()).toBe(false);
    expect(buffer.changes().size).toBe(0);
  });

  describe("editedLocales", () => {
    it("returns empty set for unedited field", () => {
      const buffer = createDraftBuffer();
      expect(buffer.editedLocales("hero", "title")).toEqual(new Set());
    });

    it("returns locale after writing to it", () => {
      const buffer = createDraftBuffer();
      buffer.write("hero", "title", "en", "Hello");
      expect(buffer.editedLocales("hero", "title")).toEqual(new Set(["en"]));
    });

    it("returns both locales after writing to both", () => {
      const buffer = createDraftBuffer();
      buffer.write("hero", "title", "en", "Hello");
      buffer.write("hero", "title", "it", "Ciao");
      expect(buffer.editedLocales("hero", "title")).toEqual(
        new Set(["en", "it"])
      );
    });

    it("does not leak locales across fields", () => {
      const buffer = createDraftBuffer();
      buffer.write("hero", "title", "en", "Hello");
      buffer.write("hero", "subtitle", "it", "Mondo");
      expect(buffer.editedLocales("hero", "title")).toEqual(new Set(["en"]));
      expect(buffer.editedLocales("hero", "subtitle")).toEqual(new Set(["it"]));
    });

    it("returns empty set after discard", () => {
      const buffer = createDraftBuffer();
      buffer.write("hero", "title", "en", "Hello");
      buffer.write("hero", "title", "it", "Ciao");
      buffer.discard();
      expect(buffer.editedLocales("hero", "title")).toEqual(new Set());
    });
  });
});
