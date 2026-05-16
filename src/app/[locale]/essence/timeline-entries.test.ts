import { describe, expect, it } from "vitest";
import { createDraftBuffer } from "@/components/admin/draft-buffer";
import {
  createEntryWrites,
  deriveBufferedEntries,
  deriveTimelineEntries,
} from "./timeline-entries";

describe("deriveTimelineEntries", () => {
  it("derives entries from data by scanning for *.title keys", () => {
    const data: Record<string, { en: string; it: string }> = {
      label: { en: "Journey", it: "Percorso" },
      title: { en: "A Path", it: "Un Cammino" },
      "abc.year": { en: "2022", it: "2022" },
      "abc.title": { en: "First Camera", it: "Prima Fotocamera" },
      "abc.description": { en: "I inherited...", it: "Ho ereditato..." },
      "def.year": { en: "2025", it: "2025" },
      "def.title": { en: "At CPF Bauer", it: "Alla CPF Bauer" },
      "def.description": { en: "After Venice...", it: "Dopo Venezia..." },
    };

    const entries = deriveTimelineEntries(data);
    expect(entries).toEqual([{ id: "abc" }, { id: "def" }]);
  });

  it("sorts entries chronologically by year value", () => {
    const data: Record<string, { en: string; it: string }> = {
      "z.year": { en: "2025", it: "2025" },
      "z.title": { en: "Later", it: "Dopo" },
      "z.description": { en: "", it: "" },
      "a.year": { en: "2020", it: "2020" },
      "a.title": { en: "Earlier", it: "Prima" },
      "a.description": { en: "", it: "" },
      "m.year": { en: "2023", it: "2023" },
      "m.title": { en: "Middle", it: "Mezzo" },
      "m.description": { en: "", it: "" },
    };

    const entries = deriveTimelineEntries(data);
    expect(entries.map((e) => e.id)).toEqual(["a", "m", "z"]);
  });

  it("returns empty array for undefined data", () => {
    expect(deriveTimelineEntries(undefined)).toEqual([]);
  });

  it("returns empty array when no timeline entries exist", () => {
    const data: Record<string, { en: string; it: string }> = {
      label: { en: "Journey", it: "Percorso" },
      title: { en: "A Path", it: "Un Cammino" },
    };
    expect(deriveTimelineEntries(data)).toEqual([]);
  });

  it("excludes entries whose ID is in the deleted set", () => {
    const data: Record<string, { en: string; it: string }> = {
      "a.year": { en: "2022", it: "2022" },
      "a.title": { en: "Keep", it: "Tieni" },
      "a.description": { en: "", it: "" },
      "b.year": { en: "2024", it: "2024" },
      "b.title": { en: "Delete Me", it: "Eliminami" },
      "b.description": { en: "", it: "" },
    };

    const entries = deriveTimelineEntries(data, new Set(["b"]));
    expect(entries).toEqual([{ id: "a" }]);
  });

  it("includes entries added via draft buffer writes (not yet in persisted data)", () => {
    const data: Record<string, { en: string; it: string }> = {
      "existing.year": { en: "2022", it: "2022" },
      "existing.title": { en: "Old", it: "Vecchio" },
      "existing.description": { en: "", it: "" },
    };

    const draftWrites: Record<string, Record<string, string>> = {
      "newentry.year": { en: "2025" },
      "newentry.title": { en: "New" },
      "newentry.description": { en: "" },
    };

    const entries = deriveTimelineEntries(data, new Set(), draftWrites);
    expect(entries).toEqual([{ id: "existing" }, { id: "newentry" }]);
  });

  it("excludes draft-only entries whose prefix is in the deleted set", () => {
    const data: Record<string, { en: string; it: string }> = {
      "existing.year": { en: "2022", it: "2022" },
      "existing.title": { en: "Old", it: "Vecchio" },
      "existing.description": { en: "", it: "" },
    };

    const draftWrites: Record<string, Record<string, string>> = {
      "newentry.year": { en: "2025" },
      "newentry.title": { en: "New" },
      "newentry.description": { en: "" },
    };

    const entries = deriveTimelineEntries(
      data,
      new Set(["newentry"]),
      draftWrites
    );
    expect(entries).toEqual([{ id: "existing" }]);
  });

  it("createEntryWrites produces writes for year, title, description in both locales", () => {
    const writes = createEntryWrites("abc", "2026");
    expect(writes).toEqual([
      { field: "abc.year", locale: "en", value: "2026" },
      { field: "abc.year", locale: "it", value: "2026" },
      { field: "abc.title", locale: "en", value: "" },
      { field: "abc.title", locale: "it", value: "" },
      { field: "abc.description", locale: "en", value: "" },
      { field: "abc.description", locale: "it", value: "" },
    ]);
  });

  it("ignores title keys that lack a corresponding year key", () => {
    const data: Record<string, { en: string; it: string }> = {
      "orphan.title": { en: "No Year", it: "Senza Anno" },
      "orphan.description": { en: "", it: "" },
      "valid.year": { en: "2024", it: "2024" },
      "valid.title": { en: "Has Year", it: "Con Anno" },
      "valid.description": { en: "", it: "" },
    };

    const entries = deriveTimelineEntries(data);
    expect(entries).toEqual([{ id: "valid" }]);
  });
});

describe("timeline entry lifecycle (draft buffer integration)", () => {
  const section = "essence.timeline";

  function deriveWithBuffer(
    data: Record<string, { en: string; it: string }> | undefined,
    buffer: ReturnType<typeof createDraftBuffer>
  ) {
    return deriveBufferedEntries(
      data,
      buffer.sectionChanges(section),
      (prefix) => buffer.isFieldDeleted(section, prefix)
    );
  }

  it("adding an entry: writes to buffer then derive → new entry appears", () => {
    const buffer = createDraftBuffer();
    const data: Record<string, { en: string; it: string }> = {
      "a.year": { en: "2022", it: "2022" },
      "a.title": { en: "First", it: "Primo" },
      "a.description": { en: "Desc", it: "Desc" },
    };

    for (const w of createEntryWrites("new1", "2026")) {
      buffer.write(section, w.field, w.locale, w.value);
    }

    const entries = deriveWithBuffer(data, buffer);
    expect(entries.map((e) => e.id)).toEqual(["a", "new1"]);
  });

  it("removing an entry: deleteField then derive → entry disappears", () => {
    const buffer = createDraftBuffer();
    const data: Record<string, { en: string; it: string }> = {
      "a.year": { en: "2022", it: "2022" },
      "a.title": { en: "First", it: "Primo" },
      "a.description": { en: "Desc", it: "Desc" },
      "b.year": { en: "2024", it: "2024" },
      "b.title": { en: "Second", it: "Secondo" },
      "b.description": { en: "Desc", it: "Desc" },
    };

    buffer.deleteField(section, "b");

    const entries = deriveWithBuffer(data, buffer);
    expect(entries.map((e) => e.id)).toEqual(["a"]);
  });

  it("add then remove in same session → entry gone", () => {
    const buffer = createDraftBuffer();
    const data: Record<string, { en: string; it: string }> = {
      "a.year": { en: "2022", it: "2022" },
      "a.title": { en: "First", it: "Primo" },
      "a.description": { en: "", it: "" },
    };

    for (const w of createEntryWrites("temp", "2025")) {
      buffer.write(section, w.field, w.locale, w.value);
    }
    buffer.deleteField(section, "temp");

    const entries = deriveWithBuffer(data, buffer);
    expect(entries.map((e) => e.id)).toEqual(["a"]);
  });
});
