import { describe, expect, it } from "vitest";
import { getDescriptor, routeSection } from "./entity-descriptors";
import { buildEntityUpdates } from "./save-routing";

describe("routeSection", () => {
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

  it("routes achievement: prefix to entity route with achievement descriptor", () => {
    const route = routeSection("achievement:ach123");
    expect(route).toEqual({
      kind: "entity",
      descriptor: getDescriptor("achievement"),
      id: "ach123",
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
});

describe("buildEntityUpdates", () => {
  it("treats coverImageUrl as a scalar field like slug", () => {
    const result = buildEntityUpdates({
      coverImageUrl: { en: "https://cdn/cover.jpg" },
    });
    expect(result).toEqual({ coverImageUrl: "https://cdn/cover.jpg" });
  });

  it("preserves localized fields as objects", () => {
    const result = buildEntityUpdates({
      title: { en: "Hello", it: "Ciao" },
    });
    expect(result).toEqual({ title: { en: "Hello", it: "Ciao" } });
  });

  it("keeps locale maps for localized entities", () => {
    const fields = {
      title: { en: "Hello", it: "Ciao" },
      description: { en: "World" },
    };
    expect(buildEntityUpdates(fields, true)).toEqual({
      title: { en: "Hello", it: "Ciao" },
      description: { en: "World" },
    });
  });

  it("extracts slug as plain string for localized entities", () => {
    const fields = { slug: { en: "my-slug" } };
    expect(buildEntityUpdates(fields, true)).toEqual({ slug: "my-slug" });
  });

  it("extracts plain strings for non-localized entities", () => {
    const fields = {
      platform: { en: "github" },
      href: { en: "https://github.com/user" },
      label: { en: "GitHub" },
    };
    expect(buildEntityUpdates(fields, false)).toEqual({
      platform: "github",
      href: "https://github.com/user",
      label: "GitHub",
    });
  });
});
