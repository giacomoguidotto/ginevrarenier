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
  useRouter: () => ({ push: mockRouterPush }),
}));

const mockRouterPush = vi.fn();

vi.mock("@/lib/hooks", () => ({
  useLocalized: () => (obj: { en: string }) => obj.en,
  useProjectImages: () => ({ images: [], isLoading: false }),
}));

vi.mock("framer-motion", () => ({
  motion: {
    div: ({
      children,
      ...props
    }: { children?: ReactNode } & Record<string, unknown>) => (
      <div {...filterProps(props)}>{children}</div>
    ),
    p: ({
      children,
      ...props
    }: { children?: ReactNode } & Record<string, unknown>) => (
      <p {...filterProps(props)}>{children}</p>
    ),
  },
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

vi.mock("@/components/admin/use-slug-derivation", () => ({
  useSlugDerivation: () => undefined,
}));

vi.mock("convex/react", () => ({
  useConvexAuth: () => ({ isAuthenticated: true }),
  useMutation: () => vi.fn(),
  useQuery: () => undefined,
}));

vi.mock("convex/_generated/api", () => ({
  api: {
    selectedWorks: { list: "selectedWorks.list" },
    projects: {
      getBySlug: "projects.getBySlug",
      getById: "projects.getById",
    },
    blogPosts: {
      getBySlug: "blogPosts.getBySlug",
      getById: "blogPosts.getById",
    },
  },
}));

let mockGetSelectionOverride: () => boolean | undefined = () => undefined;
let mockGetPublishOverride: () => boolean | undefined = () => undefined;
let mockIsPendingDeletion: () => boolean = () => false;
const mockSetSelectionOverride = vi.fn();
const mockClearSelectionOverride = vi.fn();
const mockSetPublishOverride = vi.fn();
const mockClearPublishOverride = vi.fn();
const mockTrackDeletion = vi.fn();
const mockCancelDeletion = vi.fn();

vi.mock("@/components/admin/draft-buffer-context", () => ({
  useDraftBufferOps: () => ({
    getPublishOverride: () => mockGetPublishOverride(),
    setPublishOverride: mockSetPublishOverride,
    clearPublishOverride: mockClearPublishOverride,
    getSelectionOverride: () => mockGetSelectionOverride(),
    setSelectionOverride: mockSetSelectionOverride,
    clearSelectionOverride: mockClearSelectionOverride,
    isPendingDeletion: () => mockIsPendingDeletion(),
    trackDeletion: mockTrackDeletion,
    cancelDeletion: mockCancelDeletion,
  }),
  useEditVersion: () => 0,
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

import { ProjectHeader } from "./project-page-client";

afterEach(() => {
  cleanup();
  editMode = false;
  mockGetSelectionOverride = () => undefined;
  mockGetPublishOverride = () => undefined;
  mockIsPendingDeletion = () => false;
  mockSetSelectionOverride.mockClear();
  mockClearSelectionOverride.mockClear();
  mockSetPublishOverride.mockClear();
  mockClearPublishOverride.mockClear();
  mockTrackDeletion.mockClear();
  mockCancelDeletion.mockClear();
  mockRouterPush.mockClear();
});

describe("ProjectHeader actions", () => {
  it("shows Select button when project is not selected", () => {
    editMode = true;
    render(
      <ProjectHeader
        currentSlug="solstice"
        imageCount={5}
        isSelected={false}
        projectId="proj-1"
        published={true}
      />
    );

    const btn = screen.getByTestId("header-select-button");
    expect(btn.textContent).toContain("Select");
  });

  it("shows Unselect button when project is selected", () => {
    editMode = true;
    render(
      <ProjectHeader
        currentSlug="solstice"
        imageCount={5}
        isSelected={true}
        projectId="proj-1"
        published={true}
      />
    );

    const btn = screen.getByTestId("header-unselect-button");
    expect(btn.textContent).toContain("Unselect");
  });

  it("reflects selection override over DB state", () => {
    editMode = true;
    mockGetSelectionOverride = () => true;
    render(
      <ProjectHeader
        currentSlug="solstice"
        imageCount={5}
        isSelected={false}
        projectId="proj-1"
        published={true}
      />
    );

    const btn = screen.getByTestId("header-unselect-button");
    expect(btn.textContent).toContain("Unselect");
  });

  it("clicking Select sets selection override", () => {
    editMode = true;
    render(
      <ProjectHeader
        currentSlug="solstice"
        imageCount={5}
        isSelected={false}
        projectId="proj-1"
        published={true}
      />
    );

    fireEvent.click(screen.getByTestId("header-select-button"));
    expect(mockSetSelectionOverride).toHaveBeenCalledWith("proj-1", true);
  });

  it("clicking Unselect clears selection override when toggling back to DB state", () => {
    editMode = true;
    mockGetSelectionOverride = () => true;
    render(
      <ProjectHeader
        currentSlug="solstice"
        imageCount={5}
        isSelected={false}
        projectId="proj-1"
        published={true}
      />
    );

    fireEvent.click(screen.getByTestId("header-unselect-button"));
    expect(mockClearSelectionOverride).toHaveBeenCalledWith("proj-1");
  });

  it("shows Delete button in edit mode", () => {
    editMode = true;
    render(
      <ProjectHeader
        currentSlug="solstice"
        imageCount={5}
        isSelected={false}
        projectId="proj-1"
        published={true}
      />
    );

    expect(screen.getByTestId("header-delete-button")).toBeTruthy();
  });

  it("clicking Delete marks pending deletion and redirects to /vision", () => {
    editMode = true;
    render(
      <ProjectHeader
        currentSlug="solstice"
        imageCount={5}
        isSelected={false}
        projectId="proj-1"
        published={true}
      />
    );

    fireEvent.click(screen.getByTestId("header-delete-button"));
    expect(mockTrackDeletion).toHaveBeenCalledWith("project", "proj-1");
    expect(mockRouterPush).toHaveBeenCalledWith("/vision");
  });

  it("shows only Cancel deletion button when pending deletion", () => {
    editMode = true;
    mockIsPendingDeletion = () => true;
    render(
      <ProjectHeader
        currentSlug="solstice"
        imageCount={5}
        isSelected={true}
        projectId="proj-1"
        published={true}
      />
    );

    expect(screen.getByTestId("header-cancel-deletion-button")).toBeTruthy();
    expect(screen.queryByTestId("header-select-button")).toBeNull();
    expect(screen.queryByTestId("header-unselect-button")).toBeNull();
    expect(screen.queryByTestId("header-delete-button")).toBeNull();
    expect(screen.queryByTestId("header-publish-button")).toBeNull();
    expect(screen.queryByTestId("header-unpublish-button")).toBeNull();
  });

  it("clicking Cancel deletion calls cancelDeletion", () => {
    editMode = true;
    mockIsPendingDeletion = () => true;
    render(
      <ProjectHeader
        currentSlug="solstice"
        imageCount={5}
        isSelected={false}
        projectId="proj-1"
        published={true}
      />
    );

    fireEvent.click(screen.getByTestId("header-cancel-deletion-button"));
    expect(mockCancelDeletion).toHaveBeenCalledWith("project", "proj-1");
  });

  it("shows Unpublish button for published projects", () => {
    editMode = true;
    render(
      <ProjectHeader
        currentSlug="solstice"
        imageCount={5}
        isSelected={false}
        projectId="proj-1"
        published={true}
      />
    );

    expect(screen.getByTestId("header-unpublish-button")).toBeTruthy();
    expect(screen.queryByTestId("header-publish-button")).toBeNull();
  });

  it("shows Publish button for unpublished projects", () => {
    editMode = true;
    render(
      <ProjectHeader
        currentSlug="solstice"
        imageCount={5}
        isSelected={false}
        projectId="proj-1"
        published={false}
      />
    );

    expect(screen.getByTestId("header-publish-button")).toBeTruthy();
    expect(screen.queryByTestId("header-unpublish-button")).toBeNull();
  });

  it("hides all action buttons outside edit mode", () => {
    editMode = false;
    render(
      <ProjectHeader
        currentSlug="solstice"
        imageCount={5}
        isSelected={true}
        projectId="proj-1"
        published={true}
      />
    );

    expect(screen.queryByTestId("header-select-button")).toBeNull();
    expect(screen.queryByTestId("header-unselect-button")).toBeNull();
    expect(screen.queryByTestId("header-delete-button")).toBeNull();
    expect(screen.queryByTestId("header-publish-button")).toBeNull();
    expect(screen.queryByTestId("header-unpublish-button")).toBeNull();
  });
});
