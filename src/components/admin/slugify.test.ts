import { describe, expect, it } from "vitest";
import { slugify } from "./slugify";

describe("slugify", () => {
  it("lowercases and replaces spaces with hyphens", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("removes accented characters", () => {
    expect(slugify("Café Résumé")).toBe("cafe-resume");
  });

  it("strips non-alphanumeric characters", () => {
    expect(slugify("Hello, World! #2")).toBe("hello-world-2");
  });

  it("collapses multiple hyphens", () => {
    expect(slugify("foo---bar")).toBe("foo-bar");
  });

  it("trims leading and trailing hyphens", () => {
    expect(slugify("  --hello--  ")).toBe("hello");
  });

  it("handles empty string", () => {
    expect(slugify("")).toBe("");
  });

  it("handles Italian characters", () => {
    expect(slugify("Perché è così")).toBe("perche-e-cosi");
  });
});
