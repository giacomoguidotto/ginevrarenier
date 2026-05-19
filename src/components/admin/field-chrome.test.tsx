// @vitest-environment jsdom

import { cleanup, render } from "@testing-library/react";
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
      circle: motionComponent("circle"),
      rect: motionComponent("rect"),
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

import { FieldChrome } from "./field-chrome";

afterEach(cleanup);

describe("FieldChrome", () => {
  it("renders outline rect with correct dimensions", () => {
    const { container } = render(
      <FieldChrome
        focused={false}
        height={100}
        staleLocale={null}
        width={200}
      />
    );

    const svg = container.querySelector("[data-field-chrome]");
    expect(svg).not.toBeNull();

    const rects = svg?.querySelectorAll("rect");
    expect(rects).toHaveLength(2);
    expect(rects[0].getAttribute("width")).toBe("200");
    expect(rects[0].getAttribute("height")).toBe("100");
    expect(rects[1].getAttribute("width")).toBe("200");
    expect(rects[1].getAttribute("height")).toBe("100");
  });

  it("applies focused styles when focused", () => {
    const { container: focused } = render(
      <FieldChrome focused={true} height={100} staleLocale={null} width={200} />
    );
    const { container: unfocused } = render(
      <FieldChrome
        focused={false}
        height={100}
        staleLocale={null}
        width={200}
      />
    );

    const focusedRects = focused
      .querySelector("[data-field-chrome]")
      ?.querySelectorAll("rect");
    const unfocusedRects = unfocused
      .querySelector("[data-field-chrome]")
      ?.querySelectorAll("rect");

    expect(focusedRects[0].getAttribute("stroke")).toContain("0.50");
    expect(focusedRects[1].getAttribute("opacity")).toBe("0");

    expect(unfocusedRects[0].getAttribute("stroke")).toContain("0.25");
    expect(unfocusedRects[1].getAttribute("opacity")).toBe("1");
  });

  it("renders stale-locale dot when provided and omits when null", () => {
    const { container: withLocale } = render(
      <FieldChrome focused={false} height={100} staleLocale="it" width={200} />
    );
    const { container: withoutLocale } = render(
      <FieldChrome
        focused={false}
        height={100}
        staleLocale={null}
        width={200}
      />
    );

    expect(withLocale.querySelector("circle")).not.toBeNull();
    expect(
      withLocale.querySelector("[data-slot='tooltip-content']")?.textContent
    ).toBe("IT was not modified");

    expect(withoutLocale.querySelector("circle")).toBeNull();
    expect(
      withoutLocale.querySelector("[data-slot='tooltip-content']")
    ).toBeNull();
  });

  it("does not render when unmounted", () => {
    function Harness({ show }: { show: boolean }) {
      return show ? (
        <FieldChrome
          focused={false}
          height={100}
          staleLocale={null}
          width={200}
        />
      ) : null;
    }

    const { container, rerender } = render(<Harness show={true} />);
    expect(container.querySelector("[data-field-chrome]")).not.toBeNull();

    rerender(<Harness show={false} />);
    expect(container.querySelector("[data-field-chrome]")).toBeNull();
  });
});
