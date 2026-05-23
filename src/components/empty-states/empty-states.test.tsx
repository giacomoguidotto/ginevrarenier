// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

let editMode = false;
vi.mock("@/components/admin/edit-mode-context", () => ({
  useEditMode: () => ({
    isEditMode: editMode,
  }),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("framer-motion", () => ({
  motion: {
    div: ({
      children,
      ...props
    }: { children?: ReactNode } & Record<string, unknown>) => (
      <div {...filterProps(props)}>{children}</div>
    ),
  },
}));

vi.mock("@/lib/animations", () => ({
  fadeUp: {},
}));

function filterProps(props: Record<string, unknown>) {
  const safe: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(props)) {
    if (
      typeof v === "string" ||
      typeof v === "number" ||
      typeof v === "boolean"
    ) {
      safe[k] = v;
    }
  }
  return safe;
}

import { ProjectGalleryEmptyState } from "./project-gallery-empty-state";
import { ReflectionsEmptyState } from "./reflections-empty-state";
import { VisionEmptyState } from "./vision-empty-state";

afterEach(() => {
  cleanup();
  editMode = false;
});

describe("VisionEmptyState", () => {
  it("renders title and subtitle when not in edit mode", () => {
    render(<VisionEmptyState />);
    expect(screen.getByText("empty.title")).toBeTruthy();
    expect(screen.getByText("empty.subtitle")).toBeTruthy();
  });

  it("does not render when edit mode is active", () => {
    editMode = true;
    const { container } = render(<VisionEmptyState />);
    expect(container.innerHTML).toBe("");
  });
});

describe("ReflectionsEmptyState", () => {
  it("renders title and subtitle when not in edit mode", () => {
    render(<ReflectionsEmptyState />);
    expect(screen.getByText("empty.title")).toBeTruthy();
    expect(screen.getByText("empty.subtitle")).toBeTruthy();
  });

  it("does not render when edit mode is active", () => {
    editMode = true;
    const { container } = render(<ReflectionsEmptyState />);
    expect(container.innerHTML).toBe("");
  });
});

describe("ProjectGalleryEmptyState", () => {
  it("renders title and subtitle when not in edit mode", () => {
    render(<ProjectGalleryEmptyState />);
    expect(screen.getByText("empty.title")).toBeTruthy();
    expect(screen.getByText("empty.subtitle")).toBeTruthy();
  });

  it("does not render when edit mode is active", () => {
    editMode = true;
    const { container } = render(<ProjectGalleryEmptyState />);
    expect(container.innerHTML).toBe("");
  });
});
