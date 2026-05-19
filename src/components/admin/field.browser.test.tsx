// @vitest-environment jsdom

import { act, cleanup, fireEvent, render } from "@testing-library/react";
import type { ReactNode, RefObject } from "react";
import { useRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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

class ResizeObserverMock {
  private readonly cb: ResizeObserverCallback;
  constructor(cb: ResizeObserverCallback) {
    this.cb = cb;
  }
  observe(target: Element) {
    Object.defineProperty(target, "clientWidth", {
      value: 200,
      configurable: true,
    });
    Object.defineProperty(target, "clientHeight", {
      value: 100,
      configurable: true,
    });
    this.cb(
      [{ contentRect: { width: 200, height: 100 } } as ResizeObserverEntry],
      this as unknown as ResizeObserver
    );
  }
  // biome-ignore lint/suspicious/noEmptyBlockStatements: stub
  unobserve() {}
  // biome-ignore lint/suspicious/noEmptyBlockStatements: stub
  disconnect() {}
}

vi.stubGlobal("ResizeObserver", ResizeObserverMock);

vi.mock("next-intl", () => ({
  useLocale: () => "en",
}));

vi.mock("./section", () => {
  const React = require("react");
  const ctx = React.createContext({
    name: "hero",
    data: { title: { en: "Original EN", it: "Original IT" } },
  });
  return {
    Section: ({ children }: { children: ReactNode }) =>
      React.createElement(
        ctx.Provider,
        {
          value: {
            name: "hero",
            data: { title: { en: "Original EN", it: "Original IT" } },
          },
        },
        children
      ),
    useSection: () => React.useContext(ctx),
  };
});

const bufferStore = {
  current: null as ReturnType<typeof createDraftBuffer> | null,
};

vi.mock("./draft-buffer-context", () => ({
  DraftBufferProvider: ({ children }: { children: ReactNode }) => children,
  useDraftBufferOps: () => ({
    editedLocales: (section: string, field: string) =>
      bufferStore.current?.editedLocales(section, field) ?? new Set<string>(),
    read: (section: string, field: string, locale: string) =>
      bufferStore.current?.read(section, field, locale),
    write: (section: string, field: string, locale: string, value: string) =>
      bufferStore.current?.write(section, field, locale, value),
  }),
  useDraftBufferReset: () => 0,
  useDraftBufferState: () => ({
    changeSummary: () => ({ textEdits: [] }),
    hasChanges: false,
    // biome-ignore lint/suspicious/noEmptyBlockStatements: noop stub
    save: async () => {},
    // biome-ignore lint/suspicious/noEmptyBlockStatements: noop stub
    discard: () => {},
  }),
  useEditVersion: () => 0,
}));

import { ChromeEnablerProvider, useChromeEnabler } from "./chrome-enabler";
import { createDraftBuffer } from "./draft-buffer";
import { EditModeProvider, useEditMode } from "./edit-mode-context";
import { Field } from "./field";

beforeEach(() => {
  bufferStore.current = createDraftBuffer();
  localStorage.clear();
});
afterEach(cleanup);

function Providers({ children }: { children: ReactNode }) {
  return <EditModeProvider>{children}</EditModeProvider>;
}

function EditModeToggle() {
  const { toggleEditMode, isEditMode } = useEditMode();
  return (
    <button data-testid="toggle" onClick={toggleEditMode} type="button">
      {isEditMode ? "on" : "off"}
    </button>
  );
}

function LocaleSwitcher() {
  const { editingLocale, setEditingLocale } = useEditMode();
  return (
    <button
      data-testid="switch-locale"
      onClick={() => setEditingLocale(editingLocale === "en" ? "it" : "en")}
      type="button"
    >
      {editingLocale}
    </button>
  );
}

function getFieldEl(container: HTMLElement) {
  const el = container.querySelector("[data-testid='field-wrapper'] span");
  if (!el) {
    throw new Error("Field element not found");
  }
  return el;
}

describe("Field locale switching", () => {
  function TestHarness() {
    return (
      <Providers>
        <EditModeToggle />
        <LocaleSwitcher />
        <div data-testid="field-wrapper">
          <Field as="span" name="title" />
        </div>
      </Providers>
    );
  }

  it("preserves draft when switching locales back and forth", async () => {
    const { getByTestId, container } = render(<TestHarness />);

    await act(() => getByTestId("toggle").click());

    const field = getFieldEl(container);

    await act(() => {
      field.textContent = "Edited EN";
      fireEvent.input(field);
    });

    await act(() => getByTestId("switch-locale").click());
    expect(field.textContent).toBe("Original IT");

    await act(() => getByTestId("switch-locale").click());
    expect(field.textContent).toBe("Edited EN");
  });

  it("stashes current content on locale switch without prior input event", async () => {
    const { getByTestId, container } = render(<TestHarness />);

    await act(() => getByTestId("toggle").click());

    const field = getFieldEl(container);

    await act(() => {
      field.textContent = "Stashed EN";
    });

    await act(() => getByTestId("switch-locale").click());
    expect(field.textContent).toBe("Original IT");

    await act(() => getByTestId("switch-locale").click());
    expect(field.textContent).toBe("Stashed EN");
  });

  it("preserves both locale drafts across multiple switches", async () => {
    const { getByTestId, container } = render(<TestHarness />);

    await act(() => getByTestId("toggle").click());

    const field = getFieldEl(container);

    await act(() => {
      field.textContent = "New EN";
      fireEvent.input(field);
    });

    await act(() => getByTestId("switch-locale").click());
    await act(() => {
      field.textContent = "New IT";
      fireEvent.input(field);
    });

    await act(() => getByTestId("switch-locale").click());
    expect(field.textContent).toBe("New EN");

    await act(() => getByTestId("switch-locale").click());
    expect(field.textContent).toBe("New IT");
  });
});

function ChromeEnableTrigger() {
  const { enable } = useChromeEnabler();
  return (
    <button data-testid="enable-chrome" onClick={enable} type="button">
      enable
    </button>
  );
}

function ChromeHarness({
  containerRef,
}: {
  containerRef?: RefObject<HTMLElement | null>;
}) {
  return (
    <EditModeProvider>
      <ChromeEnablerProvider>
        <EditModeToggle />
        <ChromeEnableTrigger />
        <div data-testid="field-wrapper">
          <Field as="span" containerRef={containerRef} name="title" />
        </div>
      </ChromeEnablerProvider>
    </EditModeProvider>
  );
}

describe("Field chrome integration", () => {
  it("wraps semantic element in a positioned div", async () => {
    const { getByTestId } = render(<ChromeHarness />);

    await act(() => getByTestId("toggle").click());

    const fieldWrapper = getByTestId("field-wrapper");
    const wrapper = fieldWrapper.querySelector<HTMLDivElement>(":scope > div");
    expect(wrapper).not.toBeNull();
    expect(wrapper?.style.position).toBe("relative");
    expect(wrapper?.querySelector("span")).not.toBeNull();
  });

  it("renders Chrome SVG when enabled and in edit mode", async () => {
    const { getByTestId, container } = render(<ChromeHarness />);

    await act(() => getByTestId("toggle").click());
    await act(() => getByTestId("enable-chrome").click());

    expect(container.querySelector("[data-field-chrome]")).not.toBeNull();
  });

  it("does NOT render Chrome SVG when enabled is false", async () => {
    const { getByTestId, container } = render(<ChromeHarness />);

    await act(() => getByTestId("toggle").click());

    expect(container.querySelector("[data-field-chrome]")).toBeNull();
  });

  it("does NOT render Chrome SVG when not in edit mode", async () => {
    const { getByTestId, container } = render(<ChromeHarness />);

    await act(() => getByTestId("enable-chrome").click());

    expect(container.querySelector("[data-field-chrome]")).toBeNull();
  });

  it("portals Chrome into containerRef when provided", async () => {
    function PortalHarness() {
      const ref = useRef<HTMLDivElement>(null);
      return (
        <EditModeProvider>
          <ChromeEnablerProvider>
            <EditModeToggle />
            <ChromeEnableTrigger />
            <div data-testid="container" ref={ref}>
              <div data-testid="field-wrapper">
                <Field as="span" containerRef={ref} name="title" />
              </div>
            </div>
          </ChromeEnablerProvider>
        </EditModeProvider>
      );
    }

    const { getByTestId } = render(<PortalHarness />);

    await act(() => getByTestId("toggle").click());
    await act(() => getByTestId("enable-chrome").click());

    const container = getByTestId("container");
    const fieldWrapper = getByTestId("field-wrapper");

    expect(container.querySelector("[data-field-chrome]")).not.toBeNull();
    expect(
      fieldWrapper.querySelector(":scope > div > [data-field-chrome]")
    ).toBeNull();
    expect(container.style.position).toBe("relative");
    expect(container.style.overflow).toBe("visible");
  });

  it("toggles focused state on focus and blur", async () => {
    const { getByTestId, container } = render(<ChromeHarness />);

    await act(() => getByTestId("toggle").click());
    await act(() => getByTestId("enable-chrome").click());

    const span = getByTestId("field-wrapper").querySelector("span");
    if (!span) {
      throw new Error("span not found");
    }

    await act(() => {
      fireEvent.focus(span);
    });

    const focusedRect = container.querySelector("[data-field-chrome] rect");
    expect(focusedRect?.getAttribute("stroke")).toContain("0.50");

    await act(() => {
      fireEvent.blur(span);
    });

    const blurredRect = container.querySelector("[data-field-chrome] rect");
    expect(blurredRect?.getAttribute("stroke")).toContain("0.25");
  });

  it("shows stale-locale dot when only one locale is edited", async () => {
    bufferStore.current?.write("hero", "title", "en", "Edited EN");

    const { getByTestId, container } = render(<ChromeHarness />);

    await act(() => getByTestId("toggle").click());
    await act(() => getByTestId("enable-chrome").click());

    expect(
      container.querySelector("[data-field-chrome] circle")
    ).not.toBeNull();
    expect(
      container.querySelector("[data-slot='tooltip-content']")?.textContent
    ).toBe("IT was not modified");
  });
});
