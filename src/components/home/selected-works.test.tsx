// @vitest-environment jsdom

import { cleanup, render } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

const capturedSectionProps = { current: { name: "", label: "" } };

vi.mock("@/components/admin/section", () => ({
  Section: ({
    children,
    name,
    label,
  }: {
    children: ReactNode;
    name: string;
    label: string;
  }) => {
    capturedSectionProps.current = { name, label };
    return <>{children}</>;
  },
  useSection: () => ({ name: "", data: undefined }),
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
  useConvexAuth: () => ({ isAuthenticated: false }),
  useQuery: () => [],
}));

vi.mock("@/components/admin/edit-mode-context", () => ({
  useEditMode: () => ({ isEditMode: false, editingLocale: "en" }),
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
  // biome-ignore lint/suspicious/noEmptyBlockStatements: test stub
  useChromeEnabler: () => ({ enable: () => {}, enabled: false }),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/i18n/routing", () => {
  const React = require("react");
  return {
    Link: ({
      children,
      ...props
    }: { children?: unknown } & Record<string, unknown>) =>
      React.createElement("a", props, children),
  };
});

vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => (
    // biome-ignore lint/performance/noImgElement: test mock
    // biome-ignore lint/correctness/useImageSize: test mock
    <img alt={props.alt as string} />
  ),
}));

vi.mock("lucide-react", () => {
  const React = require("react");
  return {
    ArrowRight: () => React.createElement("span"),
    ChevronLeft: () => React.createElement("span"),
    ChevronRight: () => React.createElement("span"),
  };
});

vi.mock("@/components/subscribe-form", () => ({
  SubscribeForm: () => null,
}));

vi.mock("@/components/ui/collapsible-section", () => ({
  CollapsibleSection: ({ children }: { children: unknown }) => <>{children}</>,
}));

vi.mock("@/lib/hooks", () => ({
  useLocalized: () => (obj: { en: string }) => obj.en,
}));

import { SelectedWorks } from "./selected-works";

afterEach(() => {
  cleanup();
  capturedSectionProps.current = { name: "", label: "" };
});

describe("SelectedWorks", () => {
  it("registers with section name home.selectedWorks", () => {
    render(<SelectedWorks />);
    expect(capturedSectionProps.current.name).toBe("home.selectedWorks");
  });

  it("registers with section label Selected Works", () => {
    render(<SelectedWorks />);
    expect(capturedSectionProps.current.label).toBe("Selected Works");
  });
});
