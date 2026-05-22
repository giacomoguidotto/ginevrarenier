// @vitest-environment jsdom

import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }: { children: unknown }) => children,
}));

vi.mock("next-intl", () => ({
  useLocale: () => "en",
}));

const bufferStore = {
  current: null as ReturnType<typeof createDraftBuffer> | null,
};

vi.mock("./draft-buffer-context", () => ({
  useDraftBufferOps: () => ({
    read: (section: string, field: string, locale: string) =>
      bufferStore.current?.read(section, field, locale),
    write: (section: string, field: string, locale: string, value: string) =>
      bufferStore.current?.write(section, field, locale, value),
    removeEdit: (section: string, field: string, locale: string) =>
      bufferStore.current?.removeEdit(section, field, locale),
  }),
  useDraftBufferReset: () => 0,
  useEditVersion: () => 0,
}));

import { createDraftBuffer } from "./draft-buffer";
import { EditModeProvider, useEditMode } from "./edit-mode-context";
import { PlainField } from "./plain-field";

beforeEach(() => {
  bufferStore.current = createDraftBuffer();
  localStorage.clear();
});
afterEach(cleanup);

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
  const el = container.querySelector("[data-testid='plain-field'] span");
  if (!el) {
    throw new Error("PlainField element not found");
  }
  return el;
}

describe("PlainField", () => {
  function TestHarness({ sourceValue = "hello" }: { sourceValue?: string }) {
    return (
      <EditModeProvider>
        <EditModeToggle />
        <LocaleSwitcher />
        <div data-testid="plain-field">
          <PlainField
            name="platform"
            section="social-link:sl1"
            sourceValue={sourceValue}
          />
        </div>
      </EditModeProvider>
    );
  }

  it("displays sourceValue in non-edit mode", () => {
    const { container } = render(<TestHarness sourceValue="github" />);
    const el = getFieldEl(container);
    expect(el.textContent).toBe("github");
  });

  it("becomes contentEditable in edit mode", async () => {
    const { getByTestId, container } = render(<TestHarness />);
    await act(() => getByTestId("toggle").click());
    const el = getFieldEl(container);
    expect(el.getAttribute("contenteditable")).toBe("plaintext-only");
  });

  it("writes to buffer at fixed locale en on input", async () => {
    const { getByTestId, container } = render(<TestHarness />);
    await act(() => getByTestId("toggle").click());

    const el = getFieldEl(container);
    await act(() => {
      el.textContent = "new-value";
      fireEvent.input(el);
    });

    expect(bufferStore.current?.read("social-link:sl1", "platform", "en")).toBe(
      "new-value"
    );
  });

  it("removes edit when value matches sourceValue", async () => {
    bufferStore.current?.write("social-link:sl1", "platform", "en", "edited");
    const { getByTestId, container } = render(
      <TestHarness sourceValue="hello" />
    );
    await act(() => getByTestId("toggle").click());

    const el = getFieldEl(container);
    await act(() => {
      el.textContent = "hello";
      fireEvent.input(el);
    });

    expect(
      bufferStore.current?.read("social-link:sl1", "platform", "en")
    ).toBeUndefined();
  });

  it("always writes at locale en regardless of editing locale", async () => {
    const { getByTestId, container } = render(<TestHarness />);
    await act(() => getByTestId("toggle").click());
    await act(() => getByTestId("switch-locale").click());
    expect(getByTestId("switch-locale").textContent).toBe("it");

    const el = getFieldEl(container);
    await act(() => {
      el.textContent = "written-while-it";
      fireEvent.input(el);
    });

    expect(bufferStore.current?.read("social-link:sl1", "platform", "en")).toBe(
      "written-while-it"
    );
    expect(
      bufferStore.current?.read("social-link:sl1", "platform", "it")
    ).toBeUndefined();
  });

  it("does not render chrome or staleness dots", async () => {
    bufferStore.current?.write("social-link:sl1", "platform", "en", "edited");

    const { getByTestId, container } = render(<TestHarness />);
    await act(() => getByTestId("toggle").click());

    expect(container.querySelector("[data-field-chrome]")).toBeNull();
    expect(container.querySelector("[data-slot='semantic-dot']")).toBeNull();
  });

  it("shows draft value when buffer has an edit", () => {
    bufferStore.current?.write("social-link:sl1", "platform", "en", "buffered");
    const { container } = render(<TestHarness sourceValue="original" />);
    const el = getFieldEl(container);
    expect(el.textContent).toBe("buffered");
  });
});
