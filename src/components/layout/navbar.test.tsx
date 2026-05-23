// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@clerk/nextjs", () => ({
  useClerk: () => ({ signOut: vi.fn() }),
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
  }: { children?: ReactNode; href: string } & Record<string, unknown>) => {
    const safeProps: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(props)) {
      if (key === "className" || key.startsWith("data-") || key === "onClick") {
        safeProps[key] = value;
      }
    }
    return (
      <a data-testid={`nav-${href}`} href={href} {...safeProps}>
        {children}
      </a>
    );
  },
  usePathname: () => "/",
}));

vi.mock("convex/react", () => ({
  useQuery: () => null,
}));

vi.mock("framer-motion", () => {
  const stub = ({ children }: { children?: ReactNode }) => <>{children}</>;
  return {
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
                key === "type"
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
    AnimatePresence: stub,
    useMotionValue: () => ({ set: vi.fn(), get: vi.fn(() => 0) }),
    useScroll: () => ({
      scrollY: { set: vi.fn(), get: vi.fn(() => 0) },
    }),
    useSpring: () => ({ set: vi.fn(), get: vi.fn(() => 0) }),
    useTransform: () => ({ set: vi.fn(), get: vi.fn(() => 0) }),
  };
});

let mockEditingLocale = "en";
vi.mock("@/components/admin/edit-mode-context", () => ({
  useEditMode: () => ({
    isEditMode: true,
    editingLocale: mockEditingLocale,
    setEditingLocale: vi.fn(),
  }),
}));

vi.mock("@/components/admin/draft-buffer-context", () => ({
  useDraftBufferOps: () => ({
    read: () => undefined,
    write: vi.fn(),
    editedLocales: () => new Set<string>(),
  }),
  useEditVersion: () => 0,
  useDraftBufferState: () => ({
    changeSummary: () => ({
      autoTranslations: [],
      createdEntities: [],
      dismissals: [],
      imageSwaps: [],
      pendingDeletions: [],
      publishOverrides: [],
      reorderedEntityTypes: [],
      textEdits: [],
    }),
    hasChanges: false,
    save: vi.fn(),
    discard: vi.fn(),
  }),
}));

let mockStaleFields: { section: string; field: string; locale: string }[] = [];
vi.mock("@/components/admin/use-stale-fields", () => ({
  useStaleFields: () => mockStaleFields,
}));

const mockPageRegistries = new Map<string, Map<string, string>>();
vi.mock("@/components/admin/page-boundary", () => ({
  usePageRegistry: (page: string) =>
    mockPageRegistries.get(page) ?? new Map<string, string>(),
}));

import { TooltipProvider } from "@/components/ui/tooltip";

function Providers({ children }: { children: ReactNode }) {
  return <TooltipProvider>{children}</TooltipProvider>;
}

beforeEach(() => {
  mockEditingLocale = "en";
  mockStaleFields = [];
  mockPageRegistries.clear();
});
afterEach(cleanup);

function findNavLink(href: string) {
  return screen.getAllByTestId(`nav-${href}`)[0];
}

describe("Navbar staleness dots", () => {
  it("shows a semantic dot on a nav link whose page has stale sections", async () => {
    mockPageRegistries.set(
      "essence",
      new Map([
        ["essence.hero", "Hero"],
        ["essence.cta", "CTA"],
      ])
    );
    mockStaleFields = [
      { section: "essence.hero", field: "title", locale: "en" },
    ];

    const { Navbar } = await import("./navbar");
    render(
      <Providers>
        <Navbar />
      </Providers>
    );

    const essenceLink = findNavLink("/essence");
    const dot = essenceLink.querySelector('[data-slot="semantic-dot"]');
    expect(dot).toBeTruthy();
  });

  it("does not show a dot on pages without stale sections", async () => {
    mockPageRegistries.set("essence", new Map([["essence.hero", "Hero"]]));
    mockStaleFields = [
      { section: "essence.hero", field: "title", locale: "en" },
    ];

    const { Navbar } = await import("./navbar");
    render(
      <Providers>
        <Navbar />
      </Providers>
    );

    const homeLink = findNavLink("/");
    const dot = homeLink.querySelector('[data-slot="semantic-dot"]');
    expect(dot).toBeNull();
  });

  it("does not show dots when there are no stale fields", async () => {
    const { Navbar } = await import("./navbar");
    render(
      <Providers>
        <Navbar />
      </Providers>
    );

    const dots = document.querySelectorAll('[data-slot="semantic-dot"]');
    expect(dots.length).toBe(0);
  });
});
