// @vitest-environment jsdom

import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockReplace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
  usePathname: () => "/en/vision/old-slug",
}));

const queryResults = new Map<string, unknown>();

vi.mock("convex/react", () => ({
  useQuery: (ref: { name?: string } | undefined, args: unknown) => {
    if (!ref || args === "skip") {
      return;
    }
    const key = JSON.stringify({ ref: ref.name, args });
    return queryResults.get(key);
  },
}));

vi.mock("convex/_generated/api", () => ({
  api: {
    projects: {
      getBySlug: { name: "projects.getBySlug" },
      getById: { name: "projects.getById" },
    },
    blogPosts: {
      getBySlug: { name: "blogPosts.getBySlug" },
      getById: { name: "blogPosts.getById" },
    },
  },
}));

import { useStableEntity } from "./use-stable-entity";

beforeEach(() => {
  queryResults.clear();
  mockReplace.mockClear();
});
afterEach(cleanup);

describe("useStableEntity", () => {
  it("resolves slug to ID on mount, then returns entity by ID", () => {
    queryResults.set(
      JSON.stringify({
        ref: "projects.getBySlug",
        args: { slug: "solstice" },
      }),
      { _id: "proj-1", slug: "solstice", title: { en: "S", it: "S" } }
    );
    queryResults.set(
      JSON.stringify({
        ref: "projects.getById",
        args: { id: "proj-1" },
      }),
      { _id: "proj-1", slug: "solstice", title: { en: "S", it: "S" } }
    );

    const { result } = renderHook(() => useStableEntity("project", "solstice"));

    expect(result.current.id).toBe("proj-1");
    expect(result.current.entity).toMatchObject({ slug: "solstice" });
    expect(result.current.isLoading).toBe(false);
  });

  it("returns isLoading=true when slug lookup is pending", () => {
    const { result } = renderHook(() =>
      useStableEntity("project", "pending-slug")
    );

    expect(result.current.isLoading).toBe(true);
    expect(result.current.entity).toBeUndefined();
  });

  it("calls router.replace when entity slug changes after save", () => {
    queryResults.set(
      JSON.stringify({
        ref: "projects.getBySlug",
        args: { slug: "old-slug" },
      }),
      { _id: "proj-2", slug: "old-slug", title: { en: "O", it: "O" } }
    );
    queryResults.set(
      JSON.stringify({
        ref: "projects.getById",
        args: { id: "proj-2" },
      }),
      { _id: "proj-2", slug: "old-slug", title: { en: "O", it: "O" } }
    );

    const { result, rerender } = renderHook(() =>
      useStableEntity("project", "old-slug")
    );

    expect(result.current.entity?.slug).toBe("old-slug");

    queryResults.set(
      JSON.stringify({
        ref: "projects.getById",
        args: { id: "proj-2" },
      }),
      { _id: "proj-2", slug: "new-slug", title: { en: "N", it: "N" } }
    );

    act(() => rerender());

    expect(mockReplace).toHaveBeenCalledWith(
      expect.stringContaining("new-slug")
    );
  });
});
