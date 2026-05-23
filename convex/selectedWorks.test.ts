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

async function createProject(admin: ReturnType<typeof asAdmin>, title: string) {
  return admin.mutation(api.projects.create, {
    title: { en: title, it: title },
  });
}

describe("selectedWorks.create", () => {
  it("creates a selectedWork with auto-assigned order", async () => {
    const t = convexTest(schema, modules);
    const admin = asAdmin(t);
    const projectId = await createProject(admin, "Solstice");

    const id = await admin.mutation(api.selectedWorks.create, { projectId });

    const list = await admin.query(api.selectedWorks.list, {});
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ _id: id, projectId, order: 0 });
  });

  it("assigns incrementing order values", async () => {
    const t = convexTest(schema, modules);
    const admin = asAdmin(t);
    const p1 = await createProject(admin, "First");
    const p2 = await createProject(admin, "Second");

    await admin.mutation(api.selectedWorks.create, { projectId: p1 });
    await admin.mutation(api.selectedWorks.create, { projectId: p2 });

    const list = await admin.query(api.selectedWorks.list, {});
    expect(list[0].order).toBe(0);
    expect(list[1].order).toBe(1);
  });

  it("rejects duplicate projectId", async () => {
    const t = convexTest(schema, modules);
    const admin = asAdmin(t);
    const projectId = await createProject(admin, "Solstice");

    await admin.mutation(api.selectedWorks.create, { projectId });

    await expect(
      admin.mutation(api.selectedWorks.create, { projectId })
    ).rejects.toThrow();
  });
});

describe("selectedWorks.remove", () => {
  it("deletes a selectedWork", async () => {
    const t = convexTest(schema, modules);
    const admin = asAdmin(t);
    const projectId = await createProject(admin, "Solstice");
    const id = await admin.mutation(api.selectedWorks.create, { projectId });

    await admin.mutation(api.selectedWorks.remove, { id });

    const list = await admin.query(api.selectedWorks.list, {});
    expect(list).toHaveLength(0);
  });
});

describe("selectedWorks.reorder", () => {
  it("re-assigns order fields", async () => {
    const t = convexTest(schema, modules);
    const admin = asAdmin(t);
    const p1 = await createProject(admin, "First");
    const p2 = await createProject(admin, "Second");
    const p3 = await createProject(admin, "Third");

    const sw1 = await admin.mutation(api.selectedWorks.create, {
      projectId: p1,
    });
    const sw2 = await admin.mutation(api.selectedWorks.create, {
      projectId: p2,
    });
    const sw3 = await admin.mutation(api.selectedWorks.create, {
      projectId: p3,
    });

    await admin.mutation(api.selectedWorks.reorder, {
      ids: [sw3, sw1, sw2],
    });

    const list = await admin.query(api.selectedWorks.list, {});
    expect(list[0]._id).toBe(sw3);
    expect(list[1]._id).toBe(sw1);
    expect(list[2]._id).toBe(sw2);
  });
});

async function publishProject(
  admin: ReturnType<typeof asAdmin>,
  projectId: ReturnType<typeof createProject> extends Promise<infer T>
    ? T
    : never
) {
  await admin.mutation(api.projects.update, { id: projectId, published: true });
}

describe("selectedWorks.listPublished", () => {
  it("returns hydrated project data for published selected works", async () => {
    const t = convexTest(schema, modules);
    const admin = asAdmin(t);
    const projectId = await createProject(admin, "Solstice");
    await admin.mutation(api.projects.update, {
      id: projectId,
      published: true,
      subtitle: { en: "A light study", it: "Uno studio di luce" },
      coverImageUrl: "https://example.com/cover.jpg",
    });
    await admin.mutation(api.selectedWorks.create, { projectId });

    const result = await t.query(api.selectedWorks.listPublished, {});

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      _id: projectId,
      title: { en: "Solstice", it: "Solstice" },
      subtitle: { en: "A light study", it: "Uno studio di luce" },
      coverImageUrl: "https://example.com/cover.jpg",
      published: true,
    });
    expect(result[0].slug).toBeDefined();
  });

  it("excludes selected works whose project is unpublished", async () => {
    const t = convexTest(schema, modules);
    const admin = asAdmin(t);
    const published = await createProject(admin, "Published");
    const unpublished = await createProject(admin, "Draft");
    await publishProject(admin, published);
    await admin.mutation(api.selectedWorks.create, { projectId: published });
    await admin.mutation(api.selectedWorks.create, { projectId: unpublished });

    const result = await t.query(api.selectedWorks.listPublished, {});

    expect(result).toHaveLength(1);
    expect(result[0]._id).toBe(published);
  });

  it("returns results in selectedWorks order, not project creation order", async () => {
    const t = convexTest(schema, modules);
    const admin = asAdmin(t);
    const p1 = await createProject(admin, "First Created");
    const p2 = await createProject(admin, "Second Created");
    const p3 = await createProject(admin, "Third Created");
    await publishProject(admin, p1);
    await publishProject(admin, p2);
    await publishProject(admin, p3);
    const sw1 = await admin.mutation(api.selectedWorks.create, {
      projectId: p1,
    });
    const sw2 = await admin.mutation(api.selectedWorks.create, {
      projectId: p2,
    });
    const sw3 = await admin.mutation(api.selectedWorks.create, {
      projectId: p3,
    });
    await admin.mutation(api.selectedWorks.reorder, {
      ids: [sw3, sw1, sw2],
    });

    const result = await t.query(api.selectedWorks.listPublished, {});

    expect(result.map((p) => p._id)).toEqual([p3, p1, p2]);
  });

  it("returns empty array when no selected works exist", async () => {
    const t = convexTest(schema, modules);

    const result = await t.query(api.selectedWorks.listPublished, {});

    expect(result).toEqual([]);
  });
});

describe("cascade on project deletion", () => {
  it("projects.remove deletes referencing selectedWorks", async () => {
    const t = convexTest(schema, modules);
    const admin = asAdmin(t);
    const p1 = await createProject(admin, "Venetian Light");
    const p2 = await createProject(admin, "Other");

    await admin.mutation(api.selectedWorks.create, { projectId: p1 });
    await admin.mutation(api.selectedWorks.create, { projectId: p2 });

    await admin.mutation(api.projects.remove, { id: p1 });

    const list = await admin.query(api.selectedWorks.list, {});
    expect(list).toHaveLength(1);
    expect(list[0].projectId).toBe(p2);
  });
});
