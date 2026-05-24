import { describe, expect, it } from "vitest";
import {
  formatEntityRef,
  formatEntityType,
  getDescriptor,
  routeSection,
} from "./entity-descriptors";

describe("Entity Descriptor Registry", () => {
  it("returns a descriptor for 'project'", () => {
    const d = getDescriptor("project");
    expect(d).toMatchObject({
      type: "project",
      label: "Project",
      localized: true,
    });
  });

  it("returns a descriptor for 'post'", () => {
    const d = getDescriptor("post");
    expect(d).toMatchObject({
      type: "post",
      label: "Post",
      localized: true,
    });
  });

  it("returns a descriptor for 'selectedWork'", () => {
    const d = getDescriptor("selectedWork");
    expect(d).toMatchObject({
      type: "selectedWork",
      label: "Selected Work",
      localized: false,
    });
    expect(d?.reorder).toBeDefined();
    expect(d?.publish).toBeUndefined();
    expect(d?.parent).toBeUndefined();
  });

  it("returns undefined for unknown entity types", () => {
    expect(getDescriptor("unknown")).toBeUndefined();
  });

  it("returns undefined for timeline-entry (not migrated yet)", () => {
    expect(getDescriptor("timeline-entry")).toBeUndefined();
  });

  it("returns a descriptor for 'photo' with parent relationship to project", () => {
    const d = getDescriptor("photo");
    expect(d).toMatchObject({
      type: "photo",
      label: "Photo",
      localized: false,
      parent: { entityType: "project" },
    });
    expect(d?.reorder).toBeDefined();
  });

  it("returns a descriptor for 'social-link'", () => {
    const d = getDescriptor("social-link");
    expect(d).toMatchObject({
      type: "social-link",
      label: "Social Link",
      localized: false,
    });
    expect(d?.reorder).toBeDefined();
    expect(d?.publish).toBeUndefined();
    expect(d?.parent).toBeUndefined();
  });

  it("returns a descriptor for 'artist-image-home'", () => {
    const d = getDescriptor("artist-image-home");
    expect(d).toMatchObject({
      type: "artist-image-home",
      label: "Home Artist Image",
      localized: false,
    });
  });

  it("returns a descriptor for 'artist-image-essence'", () => {
    const d = getDescriptor("artist-image-essence");
    expect(d).toMatchObject({
      type: "artist-image-essence",
      label: "Essence Artist Image",
      localized: false,
    });
  });

  it("artist image descriptors are singletons (no collection, publish, reorder)", () => {
    for (const type of ["artist-image-home", "artist-image-essence"]) {
      const d = getDescriptor(type);
      expect(d).toBeDefined();
      expect(d?.collection).toBeUndefined();
      expect(d?.publish).toBeUndefined();
      expect(d?.reorder).toBeUndefined();
    }
  });
});

describe("formatEntityRef", () => {
  it("returns registered section label when available", () => {
    const labels = new Map([["project:abc123", "Project: Solstice"]]);
    expect(formatEntityRef("project", "abc123", labels)).toBe(
      "Project: Solstice"
    );
  });

  it("falls back to descriptor label when no section label", () => {
    expect(formatEntityRef("project", "abc123", new Map())).toBe("Project");
  });

  it("falls back to descriptor label for post", () => {
    expect(formatEntityRef("post", "xyz", new Map())).toBe("Post");
  });

  it("falls back to type string for unregistered entity types", () => {
    expect(formatEntityRef("timeline-entry", "abc", new Map())).toBe(
      "Timeline Entry"
    );
  });

  it("shows parent context for photo: 'Photo in Project Title'", () => {
    const labels = new Map([["photo:img1", "Photo in Venetian Light"]]);
    expect(formatEntityRef("photo", "img1", labels)).toBe(
      "Photo in Venetian Light"
    );
  });

  it("falls back to 'Photo' when no section label for photo", () => {
    expect(formatEntityRef("photo", "img1", new Map())).toBe("Photo");
  });

  it("returns descriptor label for social-link", () => {
    expect(formatEntityRef("social-link", "abc", new Map())).toBe(
      "Social Link"
    );
  });
});

describe("formatEntityType", () => {
  it("returns descriptor label for registered types", () => {
    expect(formatEntityType("project")).toBe("Project");
    expect(formatEntityType("post")).toBe("Post");
  });

  it("returns humanized fallback for timeline-entry", () => {
    expect(formatEntityType("timeline-entry")).toBe("Timeline Entry");
  });

  it("returns descriptor label for social-link", () => {
    expect(formatEntityType("social-link")).toBe("Social Link");
  });

  it("returns label for artist image descriptors", () => {
    expect(formatEntityType("artist-image-home")).toBe("Home Artist Image");
    expect(formatEntityType("artist-image-essence")).toBe(
      "Essence Artist Image"
    );
  });
});

describe("achievement buildUpdates", () => {
  it("merges partial locale edits with existing data", () => {
    const descriptor = getDescriptor("achievement");
    const fields = { title: { en: "Updated" } };
    const existing = { title: { en: "Original", it: "Originale" } };
    const result = descriptor?.buildUpdates?.(fields, existing);
    expect(result).toEqual({ title: { en: "Updated", it: "Originale" } });
  });
});

describe("routeSection (descriptor-based)", () => {
  it("routes project: prefix to entity route with project descriptor", () => {
    const route = routeSection("project:abc123");
    expect(route).toEqual({
      kind: "entity",
      descriptor: getDescriptor("project"),
      id: "abc123",
    });
  });

  it("routes post: prefix to entity route with post descriptor", () => {
    const route = routeSection("post:xyz789");
    expect(route).toEqual({
      kind: "entity",
      descriptor: getDescriptor("post"),
      id: "xyz789",
    });
  });

  it("routes photo: prefix to entity route with photo descriptor", () => {
    const route = routeSection("photo:img123");
    expect(route).toEqual({
      kind: "entity",
      descriptor: getDescriptor("photo"),
      id: "img123",
    });
  });

  it("routes selectedWork: prefix to entity route with selectedWork descriptor", () => {
    const route = routeSection("selectedWork:sw123");
    expect(route).toEqual({
      kind: "entity",
      descriptor: getDescriptor("selectedWork"),
      id: "sw123",
    });
  });

  it("routes unprefixed sections to siteContent", () => {
    const route = routeSection("hero");
    expect(route).toEqual({ kind: "siteContent", section: "hero" });
  });

  it("routes dotted section names to siteContent", () => {
    const route = routeSection("essence.highlights");
    expect(route).toEqual({
      kind: "siteContent",
      section: "essence.highlights",
    });
  });

  it("routes social-link: prefix to entity route with social-link descriptor", () => {
    const route = routeSection("social-link:sl123");
    expect(route).toEqual({
      kind: "entity",
      descriptor: getDescriptor("social-link"),
      id: "sl123",
    });
  });
});
