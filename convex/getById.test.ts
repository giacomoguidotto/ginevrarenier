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

describe("projects.getById", () => {
  it("returns a project by ID", async () => {
    const t = convexTest(schema, modules);
    const admin = asAdmin(t);
    const id = await admin.mutation(api.projects.create, {
      slug: "test-project",
      title: { en: "Test", it: "Prova" },
      subtitle: { en: "Sub", it: "Sotto" },
      description: { en: "Desc", it: "Desc" },
      category: { en: "Cat", it: "Cat" },
    });

    const project = await admin.query(api.projects.getById, { id });
    expect(project).toMatchObject({
      slug: "test-project",
      title: { en: "Test", it: "Prova" },
    });
  });

  it("returns null for a nonexistent ID", async () => {
    const t = convexTest(schema, modules);
    const admin = asAdmin(t);
    const id = await admin.mutation(api.projects.create, {
      slug: "temp",
      title: { en: "T", it: "T" },
      subtitle: { en: "S", it: "S" },
      description: { en: "D", it: "D" },
      category: { en: "C", it: "C" },
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
