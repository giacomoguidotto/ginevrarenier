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

  it("returns undefined for unknown entity types", () => {
    expect(getDescriptor("unknown")).toBeUndefined();
  });

  it("returns undefined for timeline-entry (not migrated yet)", () => {
    expect(getDescriptor("timeline-entry")).toBeUndefined();
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
});

describe("formatEntityType", () => {
  it("returns descriptor label for registered types", () => {
    expect(formatEntityType("project")).toBe("Project");
    expect(formatEntityType("post")).toBe("Post");
  });

  it("returns humanized fallback for timeline-entry", () => {
    expect(formatEntityType("timeline-entry")).toBe("Timeline Entry");
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

  it("routes unprefixed sections to siteContent", () => {
    const route = routeSection("hero");
    expect(route).toEqual({ kind: "siteContent", section: "hero" });
  });

  it("routes dotted section names to siteContent", () => {
    const route = routeSection("essence.achievements");
    expect(route).toEqual({
      kind: "siteContent",
      section: "essence.achievements",
    });
  });
});
