// @vitest-environment jsdom

import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const MOTION_KEYS = new Set([
  "animate",
  "exit",
  "initial",
  "onAnimationComplete",
  "transition",
  "variants",
  "whileFocus",
  "whileHover",
  "whileInView",
  "whileTap",
]);

vi.mock("framer-motion", () => {
  const React = require("react");

  function motionComponent(tag: string) {
    return (props: Record<string, unknown>) => {
      const domProps: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(props)) {
        if (!MOTION_KEYS.has(k)) {
          domProps[k] = v;
        }
      }
      const animate = props.animate;
      if (animate && typeof animate === "object") {
        Object.assign(domProps, animate as object);
      }
      return React.createElement(tag, domProps);
    };
  }

  return {
    AnimatePresence: ({ children }: { children: unknown }) => children,
    motion: {
      button: motionComponent("button"),
      span: motionComponent("span"),
    },
  };
});

vi.mock("@/components/ui/tooltip", () => {
  const React = require("react");
  return {
    Tooltip: ({ children }: { children: unknown }) =>
      React.createElement("div", { "data-slot": "tooltip" }, children),
    TooltipContent: ({ children }: { children: unknown }) =>
      React.createElement("div", { "data-slot": "tooltip-content" }, children),
    TooltipTrigger: ({ children }: { children: unknown }) => children,
  };
});

import { SemanticDot } from "./semantic-dot";

afterEach(cleanup);

describe("SemanticDot", () => {
  it("renders a dot with blue color for info state", () => {
    const { container } = render(
      <SemanticDot label="Auto-translated" state="info" />
    );
    const dot = container.querySelector(
      "[data-slot='semantic-dot']"
    ) as HTMLElement;
    expect(dot).not.toBeNull();
    expect(dot.style.backgroundColor).toBe("oklch(0.65 0.18 250)");
  });

  it("renders amber for warning and red for error", () => {
    const { container: w } = render(
      <SemanticDot label="Stale" state="warning" />
    );
    const { container: e } = render(
      <SemanticDot label="Invalid" state="error" />
    );

    const wDot = w.querySelector("[data-slot='semantic-dot']") as HTMLElement;
    const eDot = e.querySelector("[data-slot='semantic-dot']") as HTMLElement;

    expect(wDot.style.backgroundColor).toBe("oklch(0.82 0.17 80)");
    expect(eDot.style.backgroundColor).toBe("oklch(0.65 0.2 25)");
  });

  it("shows label text in tooltip", () => {
    const { container } = render(
      <SemanticDot label="IT was not modified" state="warning" />
    );
    const tooltip = container.querySelector("[data-slot='tooltip-content']");
    expect(tooltip?.textContent).toBe("IT was not modified");
  });

  it("calls action callback when clicked and renders as button", () => {
    const action = vi.fn();
    const { container } = render(
      <SemanticDot action={action} label="Dismiss" state="info" />
    );
    const dot = container.querySelector("[data-slot='semantic-dot']");
    expect(dot).not.toBeNull();
    expect(dot?.tagName.toLowerCase()).toBe("button");
    fireEvent.click(dot as Element);
    expect(action).toHaveBeenCalledOnce();
  });

  it("renders as span without button role when no action provided", () => {
    const { container } = render(<SemanticDot label="Info" state="info" />);
    const dot = container.querySelector("[data-slot='semantic-dot']");
    expect(dot).not.toBeNull();
    expect(dot?.tagName.toLowerCase()).toBe("span");
  });

  it("applies entrance animation properties", () => {
    const { container } = render(<SemanticDot label="Animated" state="info" />);
    const dot = container.querySelector("[data-slot='semantic-dot']");
    expect(dot).not.toBeNull();
    expect(dot?.getAttribute("opacity")).toBe("1");
    expect(dot?.getAttribute("scale")).toBe("1");
  });
});
