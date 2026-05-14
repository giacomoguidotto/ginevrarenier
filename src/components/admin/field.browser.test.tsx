// @vitest-environment jsdom

import { act, cleanup, fireEvent, render } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ChromeProvider } from "./chrome-context";
import { createDraftBuffer } from "./draft-buffer";
import { EditModeProvider, useEditMode } from "./edit-mode-context";
import { Field } from "./field";

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
      bufferStore.current?.editedLocales(section, field),
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
}));

beforeEach(() => {
  bufferStore.current = createDraftBuffer();
  localStorage.clear();
});
afterEach(cleanup);

function Providers({ children }: { children: ReactNode }) {
  return (
    <EditModeProvider>
      <ChromeProvider>{children}</ChromeProvider>
    </EditModeProvider>
  );
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
