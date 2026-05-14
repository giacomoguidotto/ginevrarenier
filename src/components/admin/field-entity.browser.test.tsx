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
    name: "",
    data: undefined,
  });
  return {
    Section: ({ children }: { children: ReactNode }) =>
      React.createElement(
        ctx.Provider,
        { value: { name: "", data: undefined } },
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
    changeSummary: () => ({
      textEdits: [],
      imageSwaps: [],
      createdEntities: [],
      pendingDeletions: [],
    }),
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

function getFieldEl(container: HTMLElement) {
  const el = container.querySelector("[data-testid='field-wrapper'] span");
  if (!el) {
    throw new Error("Field element not found");
  }
  return el;
}

describe("Field entity mode (value/onChange)", () => {
  it("renders value from props instead of section context", () => {
    const { container } = render(
      <Providers>
        <div data-testid="field-wrapper">
          <Field
            as="span"
            name="title"
            value={{ en: "Project Title", it: "Titolo Progetto" }}
          />
        </div>
      </Providers>
    );

    const field = getFieldEl(container);
    expect(field.textContent).toBe("Project Title");
  });

  it("calls onChange with updated bilingual value on input in edit mode", async () => {
    const onChange = vi.fn();

    const { getByTestId, container } = render(
      <Providers>
        <EditModeToggle />
        <div data-testid="field-wrapper">
          <Field
            as="span"
            name="title"
            onChange={onChange}
            value={{ en: "Original", it: "Originale" }}
          />
        </div>
      </Providers>
    );

    await act(() => getByTestId("toggle").click());

    const field = getFieldEl(container);
    await act(() => {
      field.textContent = "Updated";
      fireEvent.blur(field);
    });

    expect(onChange).toHaveBeenCalledWith({ en: "Updated", it: "Originale" });
  });

  it("switches to the other locale value when editing locale changes", async () => {
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

    const { getByTestId, container } = render(
      <Providers>
        <EditModeToggle />
        <LocaleSwitcher />
        <div data-testid="field-wrapper">
          <Field
            as="span"
            name="title"
            value={{ en: "English", it: "Italiano" }}
          />
        </div>
      </Providers>
    );

    await act(() => getByTestId("toggle").click());
    expect(getFieldEl(container).textContent).toBe("English");

    await act(() => getByTestId("switch-locale").click());
    expect(getFieldEl(container).textContent).toBe("Italiano");
  });
});
