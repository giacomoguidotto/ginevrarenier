// @vitest-environment edge-runtime
/// <reference types="vite/client" />

import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { internal } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

describe("seed data", () => {
  it("registers selected works section as home.selectedWorks", async () => {
    const t = convexTest(schema, modules);

    await t.mutation(internal.seed.seed, {});

    const rows = await t.run(async (ctx) =>
      ctx.db.query("siteContent").collect()
    );
    const section = rows.find((r) => r.section === "home.selectedWorks");
    expect(section).toBeDefined();
    expect(rows.find((r) => r.section === "home.featured")).toBeUndefined();
  });
});
