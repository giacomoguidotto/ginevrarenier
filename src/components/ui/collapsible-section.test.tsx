// @vitest-environment jsdom

import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

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

import { CollapsibleSection } from "./collapsible-section";

afterEach(cleanup);

describe("CollapsibleSection", () => {
  it("renders children when visible", () => {
    const { getByText } = render(
      <CollapsibleSection visible>
        <p>Hello world</p>
      </CollapsibleSection>
    );
    expect(getByText("Hello world")).toBeDefined();
  });

  it("does not render children when not visible", () => {
    const { queryByText } = render(
      <CollapsibleSection visible={false}>
        <p>Hello world</p>
      </CollapsibleSection>
    );
    expect(queryByText("Hello world")).toBeNull();
  });
});
