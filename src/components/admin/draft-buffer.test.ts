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
      autoTranslations: [],
      createdEntities: [],
      dismissals: [],
      fieldDeletions: [],
      imageSwaps: [],
      pendingDeletions: [],
      publishOverrides: [],
      reorderedEntityTypes: [],
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
      autoTranslations: [],
      createdEntities: [],
      dismissals: [],
      fieldDeletions: [],
      imageSwaps: [],
      pendingDeletions: [],
      publishOverrides: [],
      reorderedEntityTypes: [],
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

  describe("serialize and hydrate", () => {
    it("serialize returns all buffer state as plain data", () => {
      const buffer = createDraftBuffer();
      buffer.write("hero", "title", "en", "Hello");
      buffer.write("hero", "title", "it", "Ciao");
      buffer.trackCreation("project", "p1");
      buffer.trackDeletion("post", "b1");
      buffer.deleteField("essence.timeline", "abc");

      const serialized = buffer.serialize();
      expect(serialized.store).toEqual(
        expect.arrayContaining([
          ["hero\0title\0en", "Hello"],
          ["hero\0title\0it", "Ciao"],
        ])
      );
      expect(serialized.creations).toEqual(["project\0p1"]);
      expect(serialized.deletions).toEqual(["post\0b1"]);
      expect(serialized.fieldDels).toEqual(["essence.timeline\0abc"]);
    });

    it("hydrating from serialized state restores full buffer", () => {
      const original = createDraftBuffer();
      original.write("hero", "title", "en", "Hello");
      original.write("intro", "body", "it", "Mondo");
      original.trackCreation("project", "p1");
      original.trackDeletion("post", "b1");
      original.deleteField("essence.timeline", "xyz");

      const serialized = original.serialize();
      const restored = createDraftBuffer(serialized);

      expect(restored.read("hero", "title", "en")).toBe("Hello");
      expect(restored.read("intro", "body", "it")).toBe("Mondo");
      expect(restored.isSessionCreated("project", "p1")).toBe(true);
      expect(restored.isPendingDeletion("post", "b1")).toBe(true);
      expect(restored.isFieldDeleted("essence.timeline", "xyz")).toBe(true);
      expect(restored.hasChanges()).toBe(true);
    });

    it("hydrated buffer changeSummary matches original", () => {
      const original = createDraftBuffer();
      original.write("hero", "title", "en", "New");
      original.trackCreation("project", "p1");

      const restored = createDraftBuffer(original.serialize());
      const summary = restored.changeSummary();

      expect(summary.textEdits).toHaveLength(1);
      expect(summary.textEdits[0].newValue).toBe("New");
      expect(summary.createdEntities).toEqual([
        { entityType: "project", id: "p1" },
      ]);
    });

    it("empty buffer serializes to empty arrays", () => {
      const buffer = createDraftBuffer();
      const serialized = buffer.serialize();
      expect(serialized).toEqual({
        store: [],
        creations: [],
        deletions: [],
        fieldDels: [],
        publishOverrides: [],
        reorderLists: [],
        dismissals: [],
        autoTranslations: [],
      });
    });
  });

  describe("Publish Overrides", () => {
    it("records intended publish state and reads it back", () => {
      const buffer = createDraftBuffer();
      expect(buffer.getPublishOverride("project", "p1")).toBeUndefined();
      buffer.setPublishOverride("project", "p1", true);
      expect(buffer.getPublishOverride("project", "p1")).toBe(true);
    });

    it("records unpublish intent (false)", () => {
      const buffer = createDraftBuffer();
      buffer.setPublishOverride("project", "p1", false);
      expect(buffer.getPublishOverride("project", "p1")).toBe(false);
    });

    it("clearPublishOverride removes the override", () => {
      const buffer = createDraftBuffer();
      buffer.setPublishOverride("project", "p1", true);
      buffer.clearPublishOverride("project", "p1");
      expect(buffer.getPublishOverride("project", "p1")).toBeUndefined();
    });

    it("overwriting an override replaces the previous value", () => {
      const buffer = createDraftBuffer();
      buffer.setPublishOverride("project", "p1", true);
      buffer.setPublishOverride("project", "p1", false);
      expect(buffer.getPublishOverride("project", "p1")).toBe(false);
    });

    it("hasChanges reports true when Publish Overrides exist", () => {
      const buffer = createDraftBuffer();
      buffer.setPublishOverride("project", "p1", true);
      expect(buffer.hasChanges()).toBe(true);
    });

    it("discard clears Publish Overrides", () => {
      const buffer = createDraftBuffer();
      buffer.setPublishOverride("project", "p1", true);
      buffer.setPublishOverride("post", "b1", false);
      buffer.discard();
      expect(buffer.getPublishOverride("project", "p1")).toBeUndefined();
      expect(buffer.getPublishOverride("post", "b1")).toBeUndefined();
      expect(buffer.hasChanges()).toBe(false);
    });

    it("publishOverrides accessor lists all overrides", () => {
      const buffer = createDraftBuffer();
      buffer.setPublishOverride("project", "p1", true);
      buffer.setPublishOverride("post", "b1", false);
      expect(buffer.publishOverrides()).toEqual(
        expect.arrayContaining([
          { entityType: "project", id: "p1", published: true },
          { entityType: "post", id: "b1", published: false },
        ])
      );
      expect(buffer.publishOverrides()).toHaveLength(2);
    });

    it("serialize/hydrate roundtrips Publish Overrides", () => {
      const original = createDraftBuffer();
      original.setPublishOverride("project", "p1", true);
      original.setPublishOverride("post", "b1", false);

      const restored = createDraftBuffer(original.serialize());
      expect(restored.getPublishOverride("project", "p1")).toBe(true);
      expect(restored.getPublishOverride("post", "b1")).toBe(false);
      expect(restored.publishOverrides()).toHaveLength(2);
    });

    it("hydrating old format without publishOverrides defaults to empty", () => {
      const legacy = {
        store: [] as [string, string][],
        creations: [],
        deletions: [],
        fieldDels: [],
      };
      const buffer = createDraftBuffer(legacy);
      expect(buffer.getPublishOverride("project", "p1")).toBeUndefined();
      expect(buffer.publishOverrides()).toHaveLength(0);
    });

    it("changeSummary includes Publish Overrides", () => {
      const buffer = createDraftBuffer();
      buffer.setPublishOverride("project", "p1", true);
      buffer.setPublishOverride("post", "b1", false);

      const summary = buffer.changeSummary();
      expect(summary.publishOverrides).toEqual(
        expect.arrayContaining([
          { entityType: "project", id: "p1", published: true },
          { entityType: "post", id: "b1", published: false },
        ])
      );
      expect(summary.publishOverrides).toHaveLength(2);
    });
  });

  describe("Dismissals", () => {
    it("dismiss stores and isDismissed reads back", () => {
      const buffer = createDraftBuffer();
      expect(buffer.isDismissed("hero", "title", "it")).toBe(false);
      buffer.dismiss("hero", "title", "it");
      expect(buffer.isDismissed("hero", "title", "it")).toBe(true);
    });

    it("resetDismissal clears all dismissals for a field", () => {
      const buffer = createDraftBuffer();
      buffer.dismiss("hero", "title", "it");
      buffer.dismiss("hero", "title", "en");
      buffer.resetDismissal("hero", "title");
      expect(buffer.isDismissed("hero", "title", "it")).toBe(false);
      expect(buffer.isDismissed("hero", "title", "en")).toBe(false);
    });

    it("write to source locale resets dismissals for that field", () => {
      const buffer = createDraftBuffer();
      buffer.write("hero", "title", "en", "Hello");
      buffer.dismiss("hero", "title", "it");
      buffer.write("hero", "title", "en", "Hello v2");
      expect(buffer.isDismissed("hero", "title", "it")).toBe(false);
    });

    it("write to dismissed locale does not reset dismissal", () => {
      const buffer = createDraftBuffer();
      buffer.write("hero", "title", "en", "Hello");
      buffer.dismiss("hero", "title", "it");
      buffer.write("hero", "title", "it", "Ciao");
      expect(buffer.isDismissed("hero", "title", "it")).toBe(true);
    });

    it("dismissals survive serialize/deserialize", () => {
      const original = createDraftBuffer();
      original.dismiss("hero", "title", "it");
      const restored = createDraftBuffer(original.serialize());
      expect(restored.isDismissed("hero", "title", "it")).toBe(true);
    });

    it("hydrating old format without dismissals defaults to empty", () => {
      const legacy = {
        store: [] as [string, string][],
        creations: [],
        deletions: [],
        fieldDels: [],
      };
      const buffer = createDraftBuffer(legacy);
      expect(buffer.isDismissed("hero", "title", "it")).toBe(false);
    });

    it("changeSummary includes dismissals", () => {
      const buffer = createDraftBuffer();
      buffer.dismiss("hero", "title", "it");
      buffer.dismiss("essence", "heading", "en");
      const summary = buffer.changeSummary();
      expect(summary.dismissals).toEqual(
        expect.arrayContaining([
          { section: "hero", field: "title", locale: "it" },
          { section: "essence", field: "heading", locale: "en" },
        ])
      );
      expect(summary.dismissals).toHaveLength(2);
    });

    it("discard clears dismissals", () => {
      const buffer = createDraftBuffer();
      buffer.dismiss("hero", "title", "it");
      buffer.discard();
      expect(buffer.isDismissed("hero", "title", "it")).toBe(false);
    });

    it("resetDismissal does not affect other fields", () => {
      const buffer = createDraftBuffer();
      buffer.dismiss("hero", "title", "it");
      buffer.dismiss("hero", "subtitle", "it");
      buffer.resetDismissal("hero", "title");
      expect(buffer.isDismissed("hero", "title", "it")).toBe(false);
      expect(buffer.isDismissed("hero", "subtitle", "it")).toBe(true);
    });
  });

  describe("Auto-Translations", () => {
    it("markAutoTranslated stores and isAutoTranslated reads back", () => {
      const buffer = createDraftBuffer();
      expect(buffer.isAutoTranslated("hero", "title", "it")).toBe(false);
      buffer.markAutoTranslated("hero", "title", "it");
      expect(buffer.isAutoTranslated("hero", "title", "it")).toBe(true);
    });

    it("write to source locale resets auto-translations for that field", () => {
      const buffer = createDraftBuffer();
      buffer.write("hero", "title", "en", "Hello");
      buffer.markAutoTranslated("hero", "title", "it");
      buffer.write("hero", "title", "en", "Hello v2");
      expect(buffer.isAutoTranslated("hero", "title", "it")).toBe(false);
    });

    it("write to auto-translated locale does not reset marker", () => {
      const buffer = createDraftBuffer();
      buffer.write("hero", "title", "en", "Hello");
      buffer.markAutoTranslated("hero", "title", "it");
      buffer.write("hero", "title", "it", "Ciao v2");
      expect(buffer.isAutoTranslated("hero", "title", "it")).toBe(true);
    });

    it("auto-translations survive serialize/deserialize", () => {
      const original = createDraftBuffer();
      original.markAutoTranslated("hero", "title", "it");
      const restored = createDraftBuffer(original.serialize());
      expect(restored.isAutoTranslated("hero", "title", "it")).toBe(true);
    });

    it("discard clears auto-translations", () => {
      const buffer = createDraftBuffer();
      buffer.markAutoTranslated("hero", "title", "it");
      buffer.discard();
      expect(buffer.isAutoTranslated("hero", "title", "it")).toBe(false);
    });

    it("changeSummary includes auto-translations", () => {
      const buffer = createDraftBuffer();
      buffer.markAutoTranslated("hero", "title", "it");
      const summary = buffer.changeSummary();
      expect(summary.autoTranslations).toEqual([
        { section: "hero", field: "title", locale: "it" },
      ]);
    });
  });

  describe("Reorder Lists", () => {
    it("stores and retrieves a reorder list", () => {
      const buffer = createDraftBuffer();
      expect(buffer.getReorderList("project")).toBeUndefined();
      buffer.setReorderList("project", ["p3", "p1", "p2"]);
      expect(buffer.getReorderList("project")).toEqual(["p3", "p1", "p2"]);
    });

    it("overwrites a reorder list on subsequent set", () => {
      const buffer = createDraftBuffer();
      buffer.setReorderList("project", ["p1", "p2"]);
      buffer.setReorderList("project", ["p2", "p1"]);
      expect(buffer.getReorderList("project")).toEqual(["p2", "p1"]);
    });

    it("hasChanges reports true when reorder lists exist", () => {
      const buffer = createDraftBuffer();
      buffer.setReorderList("project", ["p1"]);
      expect(buffer.hasChanges()).toBe(true);
    });

    it("discard clears reorder lists", () => {
      const buffer = createDraftBuffer();
      buffer.setReorderList("project", ["p1", "p2"]);
      buffer.discard();
      expect(buffer.getReorderList("project")).toBeUndefined();
      expect(buffer.hasChanges()).toBe(false);
    });

    it("serialize/hydrate roundtrips reorder lists", () => {
      const original = createDraftBuffer();
      original.setReorderList("project", ["p3", "p1", "p2"]);

      const restored = createDraftBuffer(original.serialize());
      expect(restored.getReorderList("project")).toEqual(["p3", "p1", "p2"]);
    });

    it("hydrating old format without reorderLists defaults to empty", () => {
      const legacy = {
        store: [] as [string, string][],
        creations: [],
        deletions: [],
        fieldDels: [],
      };
      const buffer = createDraftBuffer(legacy);
      expect(buffer.getReorderList("project")).toBeUndefined();
    });

    it("changeSummary includes reordered entity types", () => {
      const buffer = createDraftBuffer();
      buffer.setReorderList("project", ["p1", "p2"]);

      const summary = buffer.changeSummary();
      expect(summary.reorderedEntityTypes).toEqual(["project"]);
    });
  });
});
