// @vitest-environment edge-runtime
/// <reference types="vite/client" />

import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api, internal } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

function asAdmin(t: ReturnType<typeof convexTest<typeof schema.tables>>) {
  return t.withIdentity({ name: "Admin" });
}

describe("renameAchievementsToHighlights", () => {
  it("renames the section and preserves all content", async () => {
    const t = convexTest(schema, modules);
    const admin = asAdmin(t);

    await admin.mutation(api.siteContent.upsert, {
      section: "essence.achievements",
      content: {
        "years.title": { en: "Started at 19", it: "Iniziata a 19 Anni" },
        "years.description": { en: "A passion", it: "Una passione" },
      },
    });

    await t.mutation(internal.siteContent.renameAchievementsToHighlights, {});

    const old = await t.query(api.siteContent.getBySection, {
      section: "essence.achievements",
    });
    expect(old).toBeNull();

    const renamed = await t.query(api.siteContent.getBySection, {
      section: "essence.highlights",
    });
    expect(renamed?.content).toEqual({
      "years.title": { en: "Started at 19", it: "Iniziata a 19 Anni" },
      "years.description": { en: "A passion", it: "Una passione" },
    });
  });

  it("is idempotent — no-op if already renamed", async () => {
    const t = convexTest(schema, modules);
    const admin = asAdmin(t);

    await admin.mutation(api.siteContent.upsert, {
      section: "essence.highlights",
      content: {
        "years.title": { en: "Started at 19", it: "Iniziata a 19 Anni" },
      },
    });

    await t.mutation(internal.siteContent.renameAchievementsToHighlights, {});

    const result = await t.query(api.siteContent.getBySection, {
      section: "essence.highlights",
    });
    expect(result?.content).toEqual({
      "years.title": { en: "Started at 19", it: "Iniziata a 19 Anni" },
    });
  });
});
