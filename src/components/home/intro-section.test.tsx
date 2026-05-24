// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const { mockSectionContent, mockIsEditMode } = vi.hoisted(() => ({
  mockSectionContent: {
    current: undefined as
      | Record<string, { en: string; it: string }>
      | undefined,
  },
  mockIsEditMode: { current: false },
}));

vi.mock("framer-motion", () => {
  const React = require("react");
  return {
    AnimatePresence: ({ children }: { children: unknown }) => children,
    motion: {
      div: ({
        children,
        ...props
      }: { children?: unknown } & Record<string, unknown>) => {
        const domProps: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(props)) {
          if (typeof v !== "function" && typeof v !== "object") {
            domProps[k] = v;
          }
        }
        return React.createElement("div", domProps, children);
      },
    },
    useScroll: () => ({ scrollYProgress: { get: () => 0 } }),
    useTransform: () => 0,
  };
});

vi.mock("convex/react", () => ({
  useQuery: (_ref: unknown, args: unknown) => {
    if (args === "skip") {
      return;
    }
    return { content: mockSectionContent.current };
  },
}));

vi.mock("@/components/admin/page-boundary", () => ({
  usePageBoundaryRegistration: vi.fn(),
}));

// biome-ignore lint/suspicious/noEmptyBlockStatements: noop stub
const noop = () => {};

vi.mock("@/components/admin/edit-mode-context", () => ({
  useEditMode: () => ({
    isEditMode: mockIsEditMode.current,
    editingLocale: "en" as const,
    enterEditMode: noop,
    exitEditMode: noop,
    toggleEditMode: noop,
    setEditingLocale: noop,
  }),
}));

vi.mock("@/components/admin/field", () => {
  const React = require("react");
  return {
    Field: ({ name }: { name: string }) =>
      React.createElement("span", { "data-testid": `field-${name}` }, name),
  };
});

vi.mock("@/components/admin/chrome-enabler", () => ({
  ChromeEnablerProvider: ({ children }: { children: unknown }) => children,
  useChromeEnabler: () => ({ enable: noop, enabled: false }),
}));

vi.mock("@/components/admin/draft-buffer-context", () => ({
  useDraftBufferOps: () => ({
    read: () => undefined,
    write: noop,
    isPendingDeletion: () => false,
    trackCreation: noop,
    cancelCreation: noop,
    trackDeletion: noop,
    cancelDeletion: noop,
    registerSectionData: noop,
  }),
  useImageAssets: () => ({
    trackPendingDeletion: noop,
    cancelPendingDeletion: noop,
  }),
}));

vi.mock("@/components/admin/editable-image", () => {
  const React = require("react");
  return {
    EditableImage: () =>
      React.createElement("div", { "data-testid": "editable-image" }),
  };
});

vi.mock("@/i18n/routing", () => {
  const React = require("react");
  return {
    Link: React.forwardRef(
      (
        {
          children,
          ...props
        }: { children?: unknown } & Record<string, unknown>,
        ref: unknown
      ) => React.createElement("a", { ...props, ref }, children)
    ),
  };
});

vi.mock("lucide-react", () => {
  const React = require("react");
  return {
    ArrowRight: () =>
      React.createElement("span", { "data-testid": "arrow-icon" }),
  };
});

vi.mock("@/lib/cloudinary", () => ({
  cloudinaryFolder: () => "test-folder",
}));

import { IntroSection } from "./intro-section";

afterEach(() => {
  cleanup();
  mockSectionContent.current = undefined;
  mockIsEditMode.current = false;
});

const introContent = {
  label: { en: "The Artist", it: "L'Artista" },
  title: { en: "Title", it: "Titolo" },
  bio: { en: "Bio text", it: "Testo bio" },
  cta: { en: "Discover", it: "Scopri" },
  portraitImage: { en: "", it: "" },
};

describe("Credential field visibility", () => {
  it("visible when at least one locale has content", () => {
    mockSectionContent.current = {
      ...introContent,
      credential: { en: "Featured in Vogue Italia", it: "" },
    };
    mockIsEditMode.current = false;

    render(<IntroSection />);

    expect(screen.queryByTestId("field-credential")).not.toBeNull();
  });

  it("hidden when both locale values are empty and not in edit mode", () => {
    mockSectionContent.current = {
      ...introContent,
      credential: { en: "", it: "" },
    };
    mockIsEditMode.current = false;

    render(<IntroSection />);

    expect(screen.queryByTestId("field-credential")).toBeNull();
  });

  it("visible in edit mode even when both locale values are empty", () => {
    mockSectionContent.current = {
      ...introContent,
      credential: { en: "", it: "" },
    };
    mockIsEditMode.current = true;

    render(<IntroSection />);

    expect(screen.queryByTestId("field-credential")).not.toBeNull();
  });
});
