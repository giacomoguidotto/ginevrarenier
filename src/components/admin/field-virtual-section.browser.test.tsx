// @vitest-environment jsdom

import { act, cleanup, fireEvent, render } from "@testing-library/react";
import type { ReactNode } from "react";
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
    name: "project:abc123",
    data: {
      title: { en: "Solstice", it: "Solstizio" },
      description: { en: "A photo project", it: "Un progetto foto" },
    },
  });
  return {
    Section: ({ children }: { children: ReactNode }) =>
      React.createElement(ctx.Provider, { value: ctx._currentValue }, children),
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
    isAutoTranslated: (section: string, field: string, locale: string) =>
      bufferStore.current?.isAutoTranslated(section, field, locale) ?? false,
  }),
  useDraftBufferReset: () => 0,
  useEditVersion: () => 0,
}));

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

function getFieldEl(container: HTMLElement) {
  const el = container.querySelector("[data-testid='field-wrapper'] span");
  if (!el) {
    throw new Error("Field element not found");
  }
  return el;
}

describe("Field in virtual section (no value/onChange)", () => {
  it("renders entity data from section context", () => {
    const { container } = render(
      <Providers>
        <div data-testid="field-wrapper">
          <Field as="span" name="title" />
        </div>
      </Providers>
    );

    expect(getFieldEl(container).textContent).toBe("Solstice");
  });

  it("writes to Draft Buffer on edit, not directly to backend", async () => {
    const { getByTestId, container } = render(
      <Providers>
        <EditModeToggle />
        <div data-testid="field-wrapper">
          <Field as="span" name="title" />
        </div>
      </Providers>
    );

    await act(() => getByTestId("toggle").click());
    const field = getFieldEl(container);

    await act(() => {
      field.textContent = "Updated Title";
      fireEvent.input(field);
    });

    expect(bufferStore.current?.read("project:abc123", "title", "en")).toBe(
      "Updated Title"
    );
  });

  it("reads draft value over entity data", () => {
    bufferStore.current?.write("project:abc123", "title", "en", "Draft Title");

    const { container } = render(
      <Providers>
        <div data-testid="field-wrapper">
          <Field as="span" name="title" />
        </div>
      </Providers>
    );

    expect(getFieldEl(container).textContent).toBe("Draft Title");
  });
});
