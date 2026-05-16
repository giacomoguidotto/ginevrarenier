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

  it("changeSummary returns empty arrays when no changes", () => {
    const buffer = createDraftBuffer();
    expect(buffer.changeSummary()).toEqual({
      createdEntities: [],
      fieldDeletions: [],
      imageSwaps: [],
      pendingDeletions: [],
      textEdits: [],
    });
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
    expect(buffer.changeSummary()).toEqual({
      createdEntities: [],
      fieldDeletions: [],
      imageSwaps: [],
      pendingDeletions: [],
      textEdits: [],
    });
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

  describe("Session-Created Entities", () => {
    it("tracks a creation and reports it via isSessionCreated", () => {
      const buffer = createDraftBuffer();
      expect(buffer.isSessionCreated("project", "abc123")).toBe(false);
      buffer.trackCreation("project", "abc123");
      expect(buffer.isSessionCreated("project", "abc123")).toBe(true);
    });
  });

  describe("Pending Deletions", () => {
    it("tracks a deletion and reports it via isPendingDeletion", () => {
      const buffer = createDraftBuffer();
      expect(buffer.isPendingDeletion("project", "xyz789")).toBe(false);
      buffer.trackDeletion("project", "xyz789");
      expect(buffer.isPendingDeletion("project", "xyz789")).toBe(true);
    });

    it("cancelDeletion removes the pending deletion mark", () => {
      const buffer = createDraftBuffer();
      buffer.trackDeletion("project", "xyz789");
      buffer.cancelDeletion("project", "xyz789");
      expect(buffer.isPendingDeletion("project", "xyz789")).toBe(false);
    });
  });

  describe("hasChanges with entity lifecycle", () => {
    it("reports changes when a creation is tracked", () => {
      const buffer = createDraftBuffer();
      buffer.trackCreation("project", "abc123");
      expect(buffer.hasChanges()).toBe(true);
    });

    it("reports changes when a deletion is tracked", () => {
      const buffer = createDraftBuffer();
      buffer.trackDeletion("post", "xyz789");
      expect(buffer.hasChanges()).toBe(true);
    });
  });

  describe("changeSummary with entity lifecycle", () => {
    it("includes created entities in summary", () => {
      const buffer = createDraftBuffer();
      buffer.trackCreation("project", "p1");
      buffer.trackCreation("post", "b1");

      const summary = buffer.changeSummary();
      expect(summary.createdEntities).toEqual(
        expect.arrayContaining([
          { entityType: "project", id: "p1" },
          { entityType: "post", id: "b1" },
        ])
      );
      expect(summary.createdEntities).toHaveLength(2);
    });

    it("includes pending deletions in summary", () => {
      const buffer = createDraftBuffer();
      buffer.trackDeletion("project", "p2");

      const summary = buffer.changeSummary();
      expect(summary.pendingDeletions).toEqual([
        { entityType: "project", id: "p2" },
      ]);
    });

    it("returns empty arrays when no entity lifecycle changes exist", () => {
      const buffer = createDraftBuffer();
      const summary = buffer.changeSummary();
      expect(summary.createdEntities).toEqual([]);
      expect(summary.pendingDeletions).toEqual([]);
    });
  });

  describe("discard clears entity lifecycle", () => {
    it("clears creations and deletions on discard", () => {
      const buffer = createDraftBuffer();
      buffer.trackCreation("project", "p1");
      buffer.trackDeletion("post", "b1");
      buffer.discard();

      expect(buffer.isSessionCreated("project", "p1")).toBe(false);
      expect(buffer.isPendingDeletion("post", "b1")).toBe(false);
      expect(buffer.hasChanges()).toBe(false);
    });
  });

  describe("creations() and deletions() accessors", () => {
    it("creations() returns all tracked session-created entity refs", () => {
      const buffer = createDraftBuffer();
      buffer.trackCreation("project", "p1");
      buffer.trackCreation("post", "b1");

      expect(buffer.creations()).toEqual(
        expect.arrayContaining([
          { entityType: "project", id: "p1" },
          { entityType: "post", id: "b1" },
        ])
      );
      expect(buffer.creations()).toHaveLength(2);
    });

    it("deletions() returns all pending deletion refs", () => {
      const buffer = createDraftBuffer();
      buffer.trackDeletion("project", "p2");
      buffer.trackDeletion("post", "b2");

      expect(buffer.deletions()).toEqual(
        expect.arrayContaining([
          { entityType: "project", id: "p2" },
          { entityType: "post", id: "b2" },
        ])
      );
      expect(buffer.deletions()).toHaveLength(2);
    });
  });

  describe("Field Deletions", () => {
    it("deleteField marks a prefix and isFieldDeleted reports it", () => {
      const buffer = createDraftBuffer();
      expect(buffer.isFieldDeleted("essence.timeline", "abc123")).toBe(false);
      buffer.deleteField("essence.timeline", "abc123");
      expect(buffer.isFieldDeleted("essence.timeline", "abc123")).toBe(true);
    });
  });

  describe("interactions", () => {
    it("a session-created entity can be pending-deleted in the same session", () => {
      const buffer = createDraftBuffer();
      buffer.trackCreation("project", "p1");
      buffer.trackDeletion("project", "p1");

      expect(buffer.isSessionCreated("project", "p1")).toBe(true);
      expect(buffer.isPendingDeletion("project", "p1")).toBe(true);
    });

    it("cancelling deletion on a session-created entity preserves the creation tracking", () => {
      const buffer = createDraftBuffer();
      buffer.trackCreation("project", "p1");
      buffer.trackDeletion("project", "p1");
      buffer.cancelDeletion("project", "p1");

      expect(buffer.isSessionCreated("project", "p1")).toBe(true);
      expect(buffer.isPendingDeletion("project", "p1")).toBe(false);
    });

    it("duplicate trackCreation calls are idempotent", () => {
      const buffer = createDraftBuffer();
      buffer.trackCreation("project", "p1");
      buffer.trackCreation("project", "p1");
      expect(buffer.creations()).toHaveLength(1);
    });

    it("duplicate trackDeletion calls are idempotent", () => {
      const buffer = createDraftBuffer();
      buffer.trackDeletion("project", "p1");
      buffer.trackDeletion("project", "p1");
      expect(buffer.deletions()).toHaveLength(1);
    });
  });
});
