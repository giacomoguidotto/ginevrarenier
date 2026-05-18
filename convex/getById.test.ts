// @vitest-environment edge-runtime
/// <reference types="vite/client" />

import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

function asAdmin(t: ReturnType<typeof convexTest<typeof schema.tables>>) {
  return t.withIdentity({ name: "Admin" });
}

describe("projects.create", () => {
  it("creates project with just a title, derives slug from EN title", async () => {
    const t = convexTest(schema, modules);
    const admin = asAdmin(t);
    const id = await admin.mutation(api.projects.create, {
      title: { en: "Solstice", it: "Solstice" },
    });

    const project = await admin.query(api.projects.getById, { id });
    expect(project).toMatchObject({
      slug: "solstice",
      title: { en: "Solstice", it: "Solstice" },
      subtitle: { en: "", it: "" },
      description: { en: "", it: "" },
      tagline: { en: "", it: "" },
      published: false,
    });
  });

  it("auto-deduplicates slug on collision", async () => {
    const t = convexTest(schema, modules);
    const admin = asAdmin(t);
    await admin.mutation(api.projects.create, {
      title: { en: "Solstice", it: "Solstice" },
    });
    const id2 = await admin.mutation(api.projects.create, {
      title: { en: "Solstice", it: "Solstice" },
    });

    const project2 = await admin.query(api.projects.getById, { id: id2 });
    expect(project2?.slug).toBe("solstice-2");
  });

  it("assigns incrementing order values", async () => {
    const t = convexTest(schema, modules);
    const admin = asAdmin(t);
    const id1 = await admin.mutation(api.projects.create, {
      title: { en: "First", it: "Primo" },
    });
    const id2 = await admin.mutation(api.projects.create, {
      title: { en: "Second", it: "Secondo" },
    });

    const p1 = await admin.query(api.projects.getById, { id: id1 });
    const p2 = await admin.query(api.projects.getById, { id: id2 });
    expect(p1?.order).toBe(0);
    expect(p2?.order).toBe(1);
  });
});

describe("projects.getById", () => {
  it("returns a project by ID", async () => {
    const t = convexTest(schema, modules);
    const admin = asAdmin(t);
    const id = await admin.mutation(api.projects.create, {
      title: { en: "Test", it: "Prova" },
    });

    const project = await admin.query(api.projects.getById, { id });
    expect(project).toMatchObject({
      slug: "test",
      title: { en: "Test", it: "Prova" },
    });
  });

  it("returns null for a nonexistent ID", async () => {
    const t = convexTest(schema, modules);
    const admin = asAdmin(t);
    const id = await admin.mutation(api.projects.create, {
      title: { en: "Temp", it: "Temp" },
    });
    await admin.mutation(api.projects.remove, { id });

    const project = await t.query(api.projects.getById, { id });
    expect(project).toBeNull();
  });
});

describe("blogPosts.getById", () => {
  it("returns a post by ID", async () => {
    const t = convexTest(schema, modules);
    const admin = asAdmin(t);
    const id = await admin.mutation(api.blogPosts.create, {
      slug: "test-post",
      title: { en: "Post", it: "Articolo" },
      excerpt: { en: "Exc", it: "Exc" },
    });

    const post = await admin.query(api.blogPosts.getById, { id });
    expect(post).toMatchObject({
      slug: "test-post",
      title: { en: "Post", it: "Articolo" },
    });
  });

  it("returns null for a nonexistent ID", async () => {
    const t = convexTest(schema, modules);
    const admin = asAdmin(t);
    const id = await admin.mutation(api.blogPosts.create, {
      slug: "temp-post",
      title: { en: "T", it: "T" },
      excerpt: { en: "E", it: "E" },
    });
    await admin.mutation(api.blogPosts.remove, { id });

    const post = await t.query(api.blogPosts.getById, { id });
    expect(post).toBeNull();
  });
});
