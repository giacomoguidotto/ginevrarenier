import { describe, expect, it } from "vitest";
import { routeSection } from "./save-routing";

describe("routeSection", () => {
  it("routes project: prefix to project mutation", () => {
    const route = routeSection("project:abc123");
    expect(route).toEqual({ kind: "project", id: "abc123" });
  });

  it("routes post: prefix to post mutation", () => {
    const route = routeSection("post:xyz789");
    expect(route).toEqual({ kind: "post", id: "xyz789" });
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
