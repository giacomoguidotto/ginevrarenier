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
                key === "target" ||
                key === "id" ||
                key === "htmlFor"
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
  };
});

let mockSocials: Record<string, unknown>[] = [];
let mockIsEditMode = false;

vi.mock("convex/react", () => ({
  useAction: () => vi.fn(),
  useConvexAuth: () => ({
    isAuthenticated: true,
    isLoading: false,
    isRefreshing: false,
  }),
  useMutation: () => vi.fn(),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "en",
}));

vi.mock("@/lib/hooks", () => ({
  useLocalized: () => (val: Record<string, string>) => val?.en ?? "",
  useSocialLinks: () => ({ links: mockSocials, isLoading: false }),
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
    trackDeletion: vi.fn(),
    cancelDeletion: vi.fn(),
    isSessionCreated: () => false,
    setReorderList: vi.fn(),
    getReorderList: () => null,
    removeEdit: vi.fn(),
    editedLocales: () => new Set<string>(),
    fieldStatus: () => "clean",
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

vi.mock("@/components/admin/field-chrome", () => ({
  FieldChrome: () => null,
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

vi.mock("@/i18n/routing", () => ({
  Link: ({ children, href }: { children?: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("@/i18n/config", () => ({
  locales: ["en", "it"],
}));

vi.mock("@/lib/validators/inquiry", () => ({
  inquirySchema: { safeParse: () => ({ success: true }) },
}));

vi.mock("@/lib/validators/inquiry-types", () => ({
  inquiryTypes: ["collaboration", "commission", "exhibition", "press", "other"],
}));

vi.mock("@hookform/resolvers/zod", () => ({
  zodResolver: () => () => ({ values: {}, errors: {} }),
}));

vi.mock("@/lib/platform-registry", () => ({
  getDisplayValue: (p: string, h: string) => h || p,
  getHref: (p: string, h: string) => `https://${p}/${h}`,
  getHrefTemplateParts: () => ({ prefix: "", suffix: "" }),
  getIcon: () => {
    const React = require("react");
    return (props: Record<string, unknown>) =>
      React.createElement("svg", props);
  },
  getLabel: (p: string) => p,
  platformKeys: ["instagram", "x", "linkedin", "facebook", "email", "website"],
}));

vi.mock("@dnd-kit/core", () => ({
  closestCenter: vi.fn(),
  DndContext: ({ children }: { children?: ReactNode }) => <>{children}</>,
  MouseSensor: vi.fn(),
  TouchSensor: vi.fn(),
  useSensor: () => ({}),
  useSensors: () => [],
}));

vi.mock("@dnd-kit/sortable", () => ({
  SortableContext: ({ children }: { children?: ReactNode }) => <>{children}</>,
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  }),
  verticalListSortingStrategy: vi.fn(),
}));

vi.mock("@dnd-kit/utilities", () => ({
  CSS: { Transform: { toString: () => "" } },
}));

import { ConnectClient } from "./connect-client";

afterEach(cleanup);
beforeEach(() => {
  mockSocials = [];
  mockIsEditMode = false;
});

describe("Follow Along section hiding", () => {
  it("hides Follow Along when no non-email social links and not in edit mode", () => {
    render(<ConnectClient />);
    expect(screen.queryByTestId("follow-along")).toBeNull();
  });

  it("shows Follow Along when non-email links exist", () => {
    mockSocials = [
      { _id: "1", platform: "instagram", handle: "test", order: 0 },
    ];
    render(<ConnectClient />);
    expect(screen.getByTestId("follow-along")).toBeDefined();
  });

  it("always shows Direct Contact", () => {
    render(<ConnectClient />);
    expect(screen.getByText("info.directContact")).toBeDefined();
  });
});
