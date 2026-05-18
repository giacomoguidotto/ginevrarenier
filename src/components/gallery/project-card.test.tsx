// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

let editMode = false;
vi.mock("@/components/admin/edit-mode-context", () => ({
  useEditMode: () => ({
    isEditMode: editMode,
    editingLocale: "en",
  }),
}));

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/i18n/routing", () => ({
  Link: ({
    children,
    href,
    ...props
  }: {
    children: ReactNode;
    href: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/lib/hooks", () => ({
  useLocalized: () => (obj: { en: string }) => obj.en,
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

vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => (
    // biome-ignore lint/performance/noImgElement: test mock
    // biome-ignore lint/correctness/useImageSize: test mock
    <img alt={props.alt as string} />
  ),
}));

vi.mock("@/lib/animations", () => ({
  fadeUp: {},
  staggerContainer: {},
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

import { ProjectCard } from "./project-card";

afterEach(() => {
  cleanup();
  editMode = false;
});

const project = {
  _id: "proj-1" as never,
  _creationTime: 0,
  slug: "solstice",
  title: { en: "Solstice", it: "Solstizio" },
  subtitle: { en: "Sub", it: "Sotto" },
  description: { en: "Desc", it: "Desc" },
  tagline: { en: "Landscape", it: "Paesaggio" },
  coverImageUrl: "/images/cover.jpg",
  order: 0,
  published: true,
};

vi.mock("convex/react", () => ({
  useMutation: () => vi.fn(),
  useQuery: () => undefined,
}));

vi.mock("@/components/admin/section", () => ({
  Section: ({ children }: { children: ReactNode }) => <>{children}</>,
  useSection: () => ({ name: "", data: undefined }),
}));

vi.mock("@/components/admin/field", () => ({
  Field: ({
    as: Tag = "span",
    className,
    name,
  }: {
    as?: string;
    className?: string;
    name: string;
  }) => <Tag className={className} data-testid={`field-${name}`} />,
}));

vi.mock("@/components/admin/field-visibility", () => ({
  FieldVisibilityProvider: ({ children }: { children: ReactNode }) => (
    <>{children}</>
  ),
  useFieldVisibility: () => ({
    visible: true,
    // biome-ignore lint/suspicious/noEmptyBlockStatements: test stub
    markVisible: () => {},
    // biome-ignore lint/suspicious/noEmptyBlockStatements: test stub
    markHidden: () => {},
  }),
}));

describe("ProjectCard", () => {
  it("shows title below the image at rest", () => {
    render(<ProjectCard index={0} project={project} />);

    const staticTitle = screen.getByTestId("card-static-title");
    expect(staticTitle.textContent).toBe("Solstice");
  });

  it("has a hover overlay with title and tagline", () => {
    render(<ProjectCard index={0} project={project} />);

    const overlay = screen.getByTestId("card-overlay");
    expect(overlay.textContent).toContain("Solstice");
    expect(overlay.textContent).toContain("Landscape");
  });

  it("overlay is hidden by default, visible on hover via CSS", () => {
    render(<ProjectCard index={0} project={project} />);

    const overlay = screen.getByTestId("card-overlay");
    expect(overlay.className).toContain("opacity-0");
    expect(overlay.className).toContain("group-hover:opacity-100");
  });

  it("in edit mode, overlay is always visible (locked hover state)", () => {
    editMode = true;
    render(<ProjectCard index={0} project={project} />);

    const overlay = screen.getByTestId("card-overlay");
    expect(overlay.className).not.toContain("opacity-0");
    expect(overlay.className).toContain("opacity-100");
  });

  it("in edit mode, static text below is hidden", () => {
    editMode = true;
    render(<ProjectCard index={0} project={project} />);

    expect(screen.queryByTestId("card-static-title")).toBeNull();
  });

  it("shows publish button in edit mode on unpublished projects", () => {
    editMode = true;
    render(
      <ProjectCard index={0} project={{ ...project, published: false }} />
    );

    expect(screen.getByTestId("card-publish-button")).toBeTruthy();
  });

  it("hides publish button on published projects", () => {
    editMode = true;
    render(<ProjectCard index={0} project={{ ...project, published: true }} />);

    expect(screen.queryByTestId("card-publish-button")).toBeNull();
  });

  it("hides publish button when not in edit mode", () => {
    editMode = false;
    render(
      <ProjectCard index={0} project={{ ...project, published: false }} />
    );

    expect(screen.queryByTestId("card-publish-button")).toBeNull();
  });
});
