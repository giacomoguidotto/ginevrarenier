import { describe, expect, it } from "vitest";
import { getDescriptor, routeSection } from "./entity-descriptors";

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
    const route = routeSection("essence.achievements");
    expect(route).toEqual({
      kind: "siteContent",
      section: "essence.achievements",
    });
  });
});
