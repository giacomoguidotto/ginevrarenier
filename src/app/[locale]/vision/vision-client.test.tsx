// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { VisionClient } from "./vision-client";

interface Project {
  _creationTime: number;
  _id: string;
  coverImageUrl: string;
  description: { en: string; it: string };
  order: number;
  published: boolean;
  slug: string;
  subtitle: { en: string; it: string };
  tagline: { en: string; it: string };
  title: { en: string; it: string };
}

const mockCreateProject = vi.fn(async () => "new-project");
const mockProjectClick = vi.fn();
const mockTrackCreation = vi.fn();
const mockSortablePointerDown = vi.fn();
const mockSetNodeRef = vi.fn();

let mockProjects: Project[] = [];
let mockSelectedProjectIds = new Set<string>();
let mockIsDragging = false;

vi.mock("convex/_generated/api", () => ({
  api: {
    projects: {
      create: "projects.create",
      list: "projects.list",
      listPublished: "projects.listPublished",
    },
    selectedWorks: {
      list: "selectedWorks.list",
    },
  },
}));

vi.mock("convex/nextjs", () => ({
  preloadedQueryResult: () => undefined,
}));

vi.mock("convex/react", () => ({
  useConvexAuth: () => ({ isAuthenticated: true }),
  useMutation: () => mockCreateProject,
  useQuery: (query: string) => {
    if (query === "projects.list") {
      return mockProjects;
    }
    if (query === "projects.listPublished") {
      return mockProjects.filter((project) => project.published);
    }
    if (query === "selectedWorks.list") {
      return Array.from(mockSelectedProjectIds).map((projectId) => ({
        projectId,
      }));
    }
    return;
  },
}));

vi.mock("@dnd-kit/core", () => ({
  closestCenter: vi.fn(),
  DndContext: ({ children }: { children?: ReactNode }) => (
    <div data-testid="dnd-context">{children}</div>
  ),
  PointerSensor: vi.fn(),
  useSensor: () => ({}),
  useSensors: () => [],
}));

vi.mock("@dnd-kit/sortable", () => ({
  rectSortingStrategy: vi.fn(),
  SortableContext: ({ children }: { children?: ReactNode }) => (
    <div data-testid="sortable-context">{children}</div>
  ),
  useSortable: () => ({
    attributes: {},
    isDragging: mockIsDragging,
    listeners: { onPointerDown: mockSortablePointerDown },
    setNodeRef: mockSetNodeRef,
    transform: null,
    transition: undefined,
  }),
}));

vi.mock("@dnd-kit/utilities", () => ({
  CSS: {
    Transform: {
      toString: () => undefined,
    },
  },
}));

vi.mock("framer-motion", () => ({
  motion: new Proxy(
    {},
    {
      get: (_target, prop) => {
        return ({
          children,
          className,
          ...props
        }: {
          children?: ReactNode;
          className?: string;
        } & Record<string, unknown>) => {
          const Tag = String(prop) as keyof HTMLElementTagNameMap;
          const htmlProps: Record<string, unknown> = {};
          for (const [key, value] of Object.entries(props)) {
            if (key.startsWith("data-") || key === "onClick") {
              htmlProps[key] = value;
            }
          }
          // @ts-expect-error dynamic motion tag stub
          return (
            <Tag className={className} {...htmlProps}>
              {children}
            </Tag>
          );
        };
      },
    }
  ),
}));

vi.mock("lucide-react", () => ({
  GripVertical: () => <svg aria-hidden="true" />,
  Plus: () => <svg aria-hidden="true" />,
}));

vi.mock("@/components/admin/chrome-enabler", () => ({
  ChromeEnablerProvider: ({ children }: { children?: ReactNode }) => (
    <>{children}</>
  ),
  useChromeEnabler: () => ({ enable: vi.fn() }),
}));

vi.mock("@/components/admin/draft-buffer-context", () => ({
  useDraftBufferOps: () => ({
    cancelDeletion: vi.fn(),
    getReorderList: () => null,
    isPendingDeletion: () => false,
    setReorderList: vi.fn(),
    trackCreation: mockTrackCreation,
    trackDeletion: vi.fn(),
  }),
  useEditVersion: () => 0,
}));

vi.mock("@/components/admin/edit-mode-context", () => ({
  useEditMode: () => ({
    editingLocale: "en",
    isEditMode: true,
  }),
}));

vi.mock("@/components/admin/field", () => ({
  Field: ({ name }: { name: string }) => (
    <span data-testid={`field-${name}`}>{name}</span>
  ),
}));

vi.mock("@/components/admin/section", () => ({
  Section: ({ children }: { children?: ReactNode }) => <>{children}</>,
  useSection: () => ({
    data: {
      description: { en: "Description", it: "Descrizione" },
      label: { en: "Vision", it: "Visione" },
      title: { en: "Vision", it: "Visione" },
    },
  }),
}));

vi.mock("@/components/empty-states/vision-empty-state", () => ({
  VisionEmptyState: () => <div data-testid="vision-empty-state" />,
}));

vi.mock("@/components/gallery/project-card", () => ({
  ProjectCard: ({ project }: { project: Project }) => (
    <a
      data-testid={`project-card-${project._id}`}
      href={`/vision/${project.slug}`}
      onClick={(event) => {
        event.preventDefault();
        mockProjectClick();
      }}
    >
      {project.title.en}
    </a>
  ),
}));

vi.mock("@/components/layout/page-transition", () => ({
  PageTransition: ({ children }: { children?: ReactNode }) => <>{children}</>,
}));

vi.mock("@/lib/animations", () => ({
  fadeUp: {},
  staggerContainer: {},
}));

vi.mock("@/lib/hooks", () => ({
  useLocalized: () => (value: { en: string }) => value.en,
}));

const project = {
  _creationTime: 0,
  _id: "project-1",
  coverImageUrl: "/images/cover.jpg",
  description: { en: "Description", it: "Descrizione" },
  order: 0,
  published: true,
  slug: "solstice",
  subtitle: { en: "Subtitle", it: "Sottotitolo" },
  tagline: { en: "Tagline", it: "Slogan" },
  title: { en: "Solstice", it: "Solstizio" },
};

afterEach(() => {
  cleanup();
  mockProjects = [];
  mockSelectedProjectIds = new Set<string>();
  mockIsDragging = false;
  mockCreateProject.mockClear();
  mockProjectClick.mockClear();
  mockTrackCreation.mockClear();
  mockSortablePointerDown.mockClear();
  mockSetNodeRef.mockClear();
});

describe("VisionClient edit-mode project grid", () => {
  it("keeps the create project card outside dnd-kit when the grid is empty", async () => {
    render(<VisionClient />);

    expect(screen.getByTestId("vision-empty-state")).toBeTruthy();
    expect(screen.queryByTestId("dnd-context")).toBeNull();

    fireEvent.click(screen.getByTestId("create-project-card"));

    await waitFor(() => {
      expect(mockCreateProject).toHaveBeenCalledTimes(1);
    });
    expect(mockTrackCreation).toHaveBeenCalledWith("project", "new-project");
  });

  it("keeps the create project card outside the sortable region when projects exist", () => {
    mockProjects = [project];

    render(<VisionClient />);

    const createCard = screen.getByTestId("create-project-card");
    expect(createCard.closest('[data-testid="dnd-context"]')).toBeNull();
    expect(createCard.closest('[data-testid="sortable-context"]')).toBeNull();
  });

  it("lets project clicks propagate when the pointer does not become a drag", () => {
    mockProjects = [project];

    render(<VisionClient />);

    fireEvent.pointerDown(screen.getByTestId("project-card-project-1"));
    expect(mockSortablePointerDown).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTestId("project-card-project-1"));
    expect(mockProjectClick).toHaveBeenCalledTimes(1);
  });

  it("suppresses project clicks after the pointer became a drag", () => {
    mockProjects = [project];
    mockIsDragging = true;

    render(<VisionClient />);

    fireEvent.click(screen.getByTestId("project-card-project-1"));
    expect(mockProjectClick).not.toHaveBeenCalled();
  });
});
