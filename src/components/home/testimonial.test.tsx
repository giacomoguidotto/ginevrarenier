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

vi.mock("lucide-react", () => {
  const React = require("react");
  return {
    Quote: () =>
      React.createElement("span", { "data-testid": "quote-icon" }, "Quote"),
  };
});

import { Testimonial } from "./testimonial";

afterEach(() => {
  cleanup();
  mockSectionContent.current = undefined;
  mockIsEditMode.current = false;
});

describe("Testimonial visibility", () => {
  it("hidden when all fields are empty in both locales and not in edit mode", () => {
    mockSectionContent.current = {
      quote: { en: "", it: "" },
      author: { en: "", it: "" },
      role: { en: "", it: "" },
    };
    mockIsEditMode.current = false;

    render(<Testimonial />);

    expect(screen.queryByTestId("field-quote")).toBeNull();
  });

  it("visible when at least one field has content in one locale", () => {
    mockSectionContent.current = {
      quote: { en: "", it: "" },
      author: { en: "Miranda Priestly", it: "" },
      role: { en: "", it: "" },
    };
    mockIsEditMode.current = false;

    render(<Testimonial />);

    expect(screen.queryByTestId("field-quote")).not.toBeNull();
  });

  it("visible in edit mode even when all fields are empty", () => {
    mockSectionContent.current = {
      quote: { en: "", it: "" },
      author: { en: "", it: "" },
      role: { en: "", it: "" },
    };
    mockIsEditMode.current = true;

    render(<Testimonial />);

    expect(screen.queryByTestId("field-quote")).not.toBeNull();
  });
});
