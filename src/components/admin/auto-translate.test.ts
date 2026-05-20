import { describe, expect, it, vi } from "vitest";
import { autoTranslateAll } from "./auto-translate";

describe("autoTranslateAll", () => {
  it("translates a stale field, writes the result, and marks it system-filled", async () => {
    const writeTranslation = vi.fn();
    const markAutoTranslated = vi.fn();

    const result = await autoTranslateAll({
      staleFields: [{ section: "hero", field: "title", locale: "it" }],
      translate: async (text, _from, to) => `[${to}] ${text}`,
      resolveSourceText: () => ({ text: "Hello", sourceLocale: "en" }),
      writeTranslation,
      markAutoTranslated,
    });

    expect(writeTranslation).toHaveBeenCalledWith(
      "hero",
      "title",
      "it",
      "[it] Hello"
    );
    expect(markAutoTranslated).toHaveBeenCalledWith("hero", "title", "it");
    expect(result.translated).toEqual([
      { section: "hero", field: "title", locale: "it" },
    ]);
    expect(result.failed).toEqual([]);
  });

  it("passes source text and correct locale pair to the translate function", async () => {
    const translate = vi.fn().mockResolvedValue("Ciao");

    await autoTranslateAll({
      staleFields: [{ section: "hero", field: "title", locale: "it" }],
      translate,
      resolveSourceText: () => ({ text: "Hello", sourceLocale: "en" }),
      writeTranslation: vi.fn(),
      markAutoTranslated: vi.fn(),
    });

    expect(translate).toHaveBeenCalledWith("Hello", "en", "it");
  });

  it("translates multiple stale fields across sections", async () => {
    const sources: Record<string, { text: string; sourceLocale: string }> = {
      "hero\0title\0it": { text: "Hello", sourceLocale: "en" },
      "about\0heading\0it": { text: "About Me", sourceLocale: "en" },
    };
    const writeTranslation = vi.fn();
    const markAutoTranslated = vi.fn();

    const result = await autoTranslateAll({
      staleFields: [
        { section: "hero", field: "title", locale: "it" },
        { section: "about", field: "heading", locale: "it" },
      ],
      translate: async (text, _from, to) => `[${to}] ${text}`,
      resolveSourceText: (section, field, targetLocale) =>
        sources[`${section}\0${field}\0${targetLocale}`],
      writeTranslation,
      markAutoTranslated,
    });

    expect(result.translated).toHaveLength(2);
    expect(writeTranslation).toHaveBeenCalledTimes(2);
    expect(markAutoTranslated).toHaveBeenCalledTimes(2);
  });

  it("keeps successful translations when one translate call fails", async () => {
    const writeTranslation = vi.fn();
    const markAutoTranslated = vi.fn();
    let callCount = 0;

    const result = await autoTranslateAll({
      staleFields: [
        { section: "hero", field: "title", locale: "it" },
        { section: "hero", field: "subtitle", locale: "it" },
      ],
      translate: (text) => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(new Error("API down"));
        }
        return Promise.resolve(`[it] ${text}`);
      },
      resolveSourceText: (_s, field) => ({
        text: field === "title" ? "Hello" : "World",
        sourceLocale: "en",
      }),
      writeTranslation,
      markAutoTranslated,
    });

    expect(result.translated).toHaveLength(1);
    expect(result.translated[0]).toEqual({
      section: "hero",
      field: "subtitle",
      locale: "it",
    });
    expect(result.failed).toHaveLength(1);
    expect(result.failed[0].target).toEqual({
      section: "hero",
      field: "title",
      locale: "it",
    });
    expect(writeTranslation).toHaveBeenCalledTimes(1);
  });

  it("reports a field as failed when source text is unavailable", async () => {
    const translate = vi.fn();

    const result = await autoTranslateAll({
      staleFields: [{ section: "hero", field: "title", locale: "it" }],
      translate,
      resolveSourceText: () => undefined,
      writeTranslation: vi.fn(),
      markAutoTranslated: vi.fn(),
    });

    expect(result.translated).toHaveLength(0);
    expect(result.failed).toHaveLength(1);
    expect(translate).not.toHaveBeenCalled();
  });

  it("returns empty result when no stale fields are provided", async () => {
    const result = await autoTranslateAll({
      staleFields: [],
      translate: vi.fn(),
      resolveSourceText: vi.fn(),
      writeTranslation: vi.fn(),
      markAutoTranslated: vi.fn(),
    });

    expect(result).toEqual({ translated: [], failed: [] });
  });
});
