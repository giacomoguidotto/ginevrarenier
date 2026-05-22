// @vitest-environment edge-runtime
/// <reference types="vite/client" />

import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { formatYearRange } from "../src/app/[locale]/essence/year-range";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

function asAdmin(t: ReturnType<typeof convexTest<typeof schema.tables>>) {
  return t.withIdentity({ name: "Admin" });
}

describe("achievements.create", () => {
  it("creates an achievement and returns it via list ordered by startYear", async () => {
    const t = convexTest(schema, modules);
    const admin = asAdmin(t);

    await admin.mutation(api.achievements.create, {
      startYear: 2024,
      title: { en: "Beyond Borders", it: "Oltre i Confini" },
      description: { en: "Desc EN", it: "Desc IT" },
    });
    await admin.mutation(api.achievements.create, {
      startYear: 2022,
      title: { en: "First Camera", it: "Prima Fotocamera" },
      description: { en: "Inherited", it: "Ereditato" },
    });

    const achievements = await t.query(api.achievements.list);
    expect(achievements).toHaveLength(2);
    expect(achievements[0]).toMatchObject({
      startYear: 2022,
      title: { en: "First Camera", it: "Prima Fotocamera" },
    });
    expect(achievements[1]).toMatchObject({
      startYear: 2024,
      title: { en: "Beyond Borders", it: "Oltre i Confini" },
    });
  });

  it("supports optional endYear for date ranges", async () => {
    const t = convexTest(schema, modules);
    const admin = asAdmin(t);

    const id = await admin.mutation(api.achievements.create, {
      startYear: 2018,
      endYear: 2020,
      title: { en: "Studies", it: "Studi" },
      description: { en: "Academy", it: "Accademia" },
    });

    const achievement = await t.query(api.achievements.getById, { id });
    expect(achievement).toMatchObject({
      startYear: 2018,
      endYear: 2020,
      title: { en: "Studies", it: "Studi" },
    });
  });
});

describe("achievements.update", () => {
  it("patches fields without overwriting others", async () => {
    const t = convexTest(schema, modules);
    const admin = asAdmin(t);

    const id = await admin.mutation(api.achievements.create, {
      startYear: 2022,
      title: { en: "Original", it: "Originale" },
      description: { en: "Desc", it: "Desc" },
    });

    await admin.mutation(api.achievements.update, {
      id,
      title: { en: "Updated", it: "Aggiornato" },
    });

    const achievement = await t.query(api.achievements.getById, { id });
    expect(achievement).toMatchObject({
      startYear: 2022,
      title: { en: "Updated", it: "Aggiornato" },
      description: { en: "Desc", it: "Desc" },
    });
  });
});

describe("migrateTimeline", () => {
  it("converts siteContent flat keys into achievement rows", async () => {
    const t = convexTest(schema, modules);
    const admin = asAdmin(t);

    await admin.mutation(api.siteContent.upsert, {
      section: "essence.timeline",
      content: {
        label: { en: "Journey", it: "Percorso" },
        title: { en: "A Path", it: "Un Cammino" },
        "2022.year": { en: "2022", it: "2022" },
        "2022.title": { en: "First Camera", it: "Prima Fotocamera" },
        "2022.description": { en: "Inherited", it: "Ereditato" },
        "2024.year": { en: "2024", it: "2024" },
        "2024.title": { en: "Beyond Borders", it: "Oltre i Confini" },
        "2024.description": { en: "Immersed", it: "Immerso" },
      },
    });

    await t.mutation(api.achievements.migrateFromTimeline, {});

    const achievements = await t.query(api.achievements.list);
    expect(achievements).toHaveLength(2);
    expect(achievements[0]).toMatchObject({
      startYear: 2022,
      title: { en: "First Camera", it: "Prima Fotocamera" },
      description: { en: "Inherited", it: "Ereditato" },
    });
    expect(achievements[1]).toMatchObject({
      startYear: 2024,
      title: { en: "Beyond Borders", it: "Oltre i Confini" },
      description: { en: "Immersed", it: "Immerso" },
    });
  });

  it("preserves non-entry keys (label, title) in siteContent", async () => {
    const t = convexTest(schema, modules);
    const admin = asAdmin(t);

    await admin.mutation(api.siteContent.upsert, {
      section: "essence.timeline",
      content: {
        label: { en: "Journey", it: "Percorso" },
        title: { en: "A Path", it: "Un Cammino" },
        "2022.year": { en: "2022", it: "2022" },
        "2022.title": { en: "First Camera", it: "Prima Fotocamera" },
        "2022.description": { en: "Inherited", it: "Ereditato" },
      },
    });

    await t.mutation(api.achievements.migrateFromTimeline, {});

    const section = await t.query(api.siteContent.getBySection, {
      section: "essence.timeline",
    });
    expect(section?.content).toEqual({
      label: { en: "Journey", it: "Percorso" },
      title: { en: "A Path", it: "Un Cammino" },
    });
  });

  it("skips migration if achievements already exist", async () => {
    const t = convexTest(schema, modules);
    const admin = asAdmin(t);

    await admin.mutation(api.achievements.create, {
      startYear: 2020,
      title: { en: "Existing", it: "Esistente" },
      description: { en: "", it: "" },
    });

    await admin.mutation(api.siteContent.upsert, {
      section: "essence.timeline",
      content: {
        "2022.year": { en: "2022", it: "2022" },
        "2022.title": { en: "Should Not Migrate", it: "Non Migrare" },
        "2022.description": { en: "", it: "" },
      },
    });

    await t.mutation(api.achievements.migrateFromTimeline, {});

    const achievements = await t.query(api.achievements.list);
    expect(achievements).toHaveLength(1);
    expect(achievements[0].title.en).toBe("Existing");
  });
});

describe("achievements.remove", () => {
  it("deletes the achievement", async () => {
    const t = convexTest(schema, modules);
    const admin = asAdmin(t);

    const id = await admin.mutation(api.achievements.create, {
      startYear: 2022,
      title: { en: "Temp", it: "Temp" },
      description: { en: "", it: "" },
    });

    await admin.mutation(api.achievements.remove, { id });

    const achievement = await t.query(api.achievements.getById, { id });
    expect(achievement).toBeNull();
  });
});

describe("formatYearRange", () => {
  it("shows just startYear when no endYear", () => {
    expect(formatYearRange(2022)).toBe("2022");
  });

  it("shows range when endYear differs", () => {
    expect(formatYearRange(2018, 2020)).toBe("2018 — 2020");
  });

  it("shows single year when startYear equals endYear", () => {
    expect(formatYearRange(2022, 2022)).toBe("2022");
  });
});
