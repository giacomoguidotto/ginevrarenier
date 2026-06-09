// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("framer-motion", () => {
  const stub = ({ children }: { children?: ReactNode }) => <>{children}</>;
  return {
    AnimatePresence: stub,
    motion: new Proxy(
      {},
      {
        get: (_target, prop) => {
          return ({
            children,
            className,
            style,
            ...rest
          }: {
            children?: ReactNode;
            className?: string;
            style?: Record<string, unknown>;
          } & Record<string, unknown>) => {
            const Tag = String(prop) as keyof HTMLElementTagNameMap;
            const htmlProps: Record<string, unknown> = {};
            for (const [key, value] of Object.entries(rest)) {
              if (
                key.startsWith("data-") ||
                key === "onClick" ||
                key === "type" ||
                key === "href" ||
                key === "rel" ||
                key === "target"
              ) {
                htmlProps[key] = value;
              }
            }
            // @ts-expect-error dynamic tag
            return (
              <Tag className={className} style={style} {...htmlProps}>
                {children}
              </Tag>
            );
          };
        },
      }
    ),
    useScroll: () => ({
      scrollYProgress: { set: vi.fn(), get: vi.fn(() => 0) },
    }),
    useTransform: () => ({ set: vi.fn(), get: vi.fn(() => 0) }),
  };
});

let mockAchievements: Record<string, unknown>[] = [];
let mockIsEditMode = false;

vi.mock("convex/react", () => ({
  useConvexAuth: () => ({
    isAuthenticated: true,
    isLoading: false,
    isRefreshing: false,
  }),
  useMutation: () => vi.fn(),
  useQuery: () => mockAchievements,
}));

vi.mock("@/components/admin/edit-mode-context", () => ({
  useEditMode: () => ({ isEditMode: mockIsEditMode }),
}));

vi.mock("@/components/admin/draft-buffer-context", () => ({
  useDraftBufferOps: () => ({
    read: () => undefined,
    write: vi.fn(),
    isPendingDeletion: () => false,
    trackCreation: vi.fn(),
    cancelCreation: vi.fn(),
    trackDeletion: vi.fn(),
    cancelDeletion: vi.fn(),
    isSessionCreated: () => false,
    setReorderList: vi.fn(),
    getReorderList: () => null,
    removeEdit: vi.fn(),
    editedLocales: () => new Set<string>(),
    fieldStatus: () => "clean",
  }),
  useImageAssets: () => ({
    trackPendingDeletion: vi.fn(),
    cancelPendingDeletion: vi.fn(),
  }),
  useEditVersion: () => 0,
}));

vi.mock("@/components/admin/chrome-enabler", () => ({
  ChromeEnablerProvider: ({ children }: { children?: ReactNode }) => (
    <>{children}</>
  ),
  useChromeEnabler: () => ({ enable: vi.fn(), enabled: false }),
}));

vi.mock("@/components/admin/field", () => ({
  Field: ({ name }: { name: string }) => (
    <span data-testid={`field-${name}`}>{name}</span>
  ),
}));

vi.mock("@/components/admin/section", () => ({
  Section: ({ children }: { children?: ReactNode }) => <>{children}</>,
  useSection: () => ({ data: {} }),
}));

vi.mock("@/components/admin/page-boundary", () => ({
  usePageBoundaryRegistration: vi.fn(),
}));

vi.mock("@/components/layout/page-transition", () => ({
  PageTransition: ({ children }: { children?: ReactNode }) => <>{children}</>,
}));

vi.mock("@/components/admin/editable-image", () => ({
  EditableImage: () => <div data-testid="editable-image" />,
}));

vi.mock("@/i18n/routing", () => ({
  Link: ({ children, href }: { children?: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("@/lib/hooks", () => ({
  useLocalized: () => (val: Record<string, string>) => val?.en ?? "",
}));

import { EssenceClient } from "./essence-client";

afterEach(cleanup);
beforeEach(() => {
  mockAchievements = [];
  mockIsEditMode = false;
});

describe("Achievements timeline section hiding", () => {
  it("hides the timeline when no achievements and not in edit mode", () => {
    render(<EssenceClient />);
    expect(screen.queryByTestId("achievements-timeline")).toBeNull();
  });

  it("shows the timeline when achievements exist", () => {
    mockAchievements = [
      {
        _id: "1",
        _creationTime: 0,
        startYear: 2020,
        title: { en: "Test", it: "" },
        description: { en: "", it: "" },
      },
    ];
    render(<EssenceClient />);
    expect(screen.getByTestId("achievements-timeline")).toBeDefined();
  });
});
