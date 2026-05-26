// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

let editMode = false;
vi.mock("@/components/admin/edit-mode-context", () => ({
  useEditMode: () => ({
    isEditMode: editMode,
    editingLocale: "en",
  }),
}));

let mockGetPublishOverride: (
  entityType: string,
  id: string
) => boolean | undefined = () => undefined;
let mockGetSelectionOverride: (projectId: string) => boolean | undefined = () =>
  undefined;
const mockSetPublishOverride = vi.fn();
const mockClearPublishOverride = vi.fn();
const mockSetSelectionOverride = vi.fn();
const mockClearSelectionOverride = vi.fn();

vi.mock("@/components/admin/draft-buffer-context", () => ({
  useDraftBufferOps: () => ({
    getPublishOverride: (et: string, id: string) =>
      mockGetPublishOverride(et, id),
    setPublishOverride: mockSetPublishOverride,
    clearPublishOverride: mockClearPublishOverride,
    getSelectionOverride: (pid: string) => mockGetSelectionOverride(pid),
    setSelectionOverride: mockSetSelectionOverride,
    clearSelectionOverride: mockClearSelectionOverride,
  }),
  useEditVersion: () => 0,
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
  mockGetPublishOverride = () => undefined;
  mockGetSelectionOverride = () => undefined;
  mockSetPublishOverride.mockClear();
  mockClearPublishOverride.mockClear();
  mockSetSelectionOverride.mockClear();
  mockClearSelectionOverride.mockClear();
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
    readOnly,
  }: {
    as?: string;
    className?: string;
    name: string;
    readOnly?: boolean;
  }) => (
    <Tag
      className={className}
      data-readonly={readOnly ? "true" : undefined}
      data-testid={`field-${name}`}
    />
  ),
}));

vi.mock("@/components/admin/chrome-enabler", () => ({
  ChromeEnablerProvider: ({ children }: { children: ReactNode }) => (
    <>{children}</>
  ),
  useChromeEnabler: () => ({
    enabled: true,
    // biome-ignore lint/suspicious/noEmptyBlockStatements: test stub
    enable: () => {},
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

  it("shows filled amber star on selected project in edit mode", () => {
    editMode = true;
    render(<ProjectCard index={0} isSelected project={project} />);

    const star = screen.getByTestId("card-select-button");
    expect(star.querySelector("svg")?.getAttribute("class")).toContain(
      "fill-amber"
    );
  });

  it("shows outline star on unselected project in edit mode", () => {
    editMode = true;
    render(<ProjectCard index={0} isSelected={false} project={project} />);

    const star = screen.getByTestId("card-select-button");
    expect(star.querySelector("svg")?.getAttribute("class")).not.toContain(
      "fill-amber"
    );
  });

  it("hides star button when not in edit mode", () => {
    editMode = false;
    render(<ProjectCard index={0} isSelected project={project} />);

    expect(screen.queryByTestId("card-select-button")).toBeNull();
  });

  it("clicking star on unselected project sets selection override to true", () => {
    editMode = true;
    render(<ProjectCard index={0} isSelected={false} project={project} />);

    fireEvent.click(screen.getByTestId("card-select-button"));
    expect(mockSetSelectionOverride).toHaveBeenCalledWith("proj-1", true);
  });

  it("clicking star on selected project sets selection override to false", () => {
    editMode = true;
    render(<ProjectCard index={0} isSelected project={project} />);

    fireEvent.click(screen.getByTestId("card-select-button"));
    expect(mockSetSelectionOverride).toHaveBeenCalledWith("proj-1", false);
  });

  it("selection override flips effective state: DB unselected + override true → filled", () => {
    editMode = true;
    mockGetSelectionOverride = () => true;
    render(<ProjectCard index={0} isSelected={false} project={project} />);

    const star = screen.getByTestId("card-select-button");
    expect(star.querySelector("svg")?.getAttribute("class")).toContain(
      "fill-amber"
    );
  });

  it("selection override flips effective state: DB selected + override false → outline", () => {
    editMode = true;
    mockGetSelectionOverride = () => false;
    render(<ProjectCard index={0} isSelected project={project} />);

    const star = screen.getByTestId("card-select-button");
    expect(star.querySelector("svg")?.getAttribute("class")).not.toContain(
      "fill-amber"
    );
  });

  it("publish button is icon-only (no text)", () => {
    editMode = true;
    render(
      <ProjectCard index={0} project={{ ...project, published: false }} />
    );

    const btn = screen.getByTestId("card-publish-button");
    expect(btn.textContent).toBe("");
  });

  it("unpublish button is icon-only (no text)", () => {
    editMode = true;
    render(<ProjectCard index={0} project={{ ...project, published: true }} />);

    const btn = screen.getByTestId("card-unpublish-button");
    expect(btn.textContent).toBe("");
  });

  it("pending deletion hides select, delete, and publish buttons", () => {
    editMode = true;
    const onDelete = vi.fn();
    const onCancelDeletion = vi.fn();
    render(
      <ProjectCard
        index={0}
        isSelected
        onCancelDeletion={onCancelDeletion}
        onDelete={onDelete}
        pendingDeletion
        project={{ ...project, published: false }}
      />
    );

    expect(screen.queryByTestId("card-select-button")).toBeNull();
    expect(screen.queryByTestId("card-delete-button")).toBeNull();
    expect(screen.queryByTestId("card-publish-button")).toBeNull();
    expect(screen.getByTestId("card-cancel-deletion-button")).toBeTruthy();
  });

  it("pending deletion makes Fields non-editable", () => {
    editMode = true;
    render(
      <ProjectCard
        index={0}
        onCancelDeletion={vi.fn()}
        pendingDeletion
        project={project}
      />
    );

    const tagline = screen.getByTestId("field-tagline");
    const title = screen.getByTestId("field-title");
    expect(tagline.getAttribute("data-readonly")).toBe("true");
    expect(title.getAttribute("data-readonly")).toBe("true");
  });
});
