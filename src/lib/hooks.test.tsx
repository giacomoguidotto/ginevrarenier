// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  EditModeProvider,
  useEditMode,
} from "@/components/admin/edit-mode-context";
import type { Locale } from "@/i18n/config";
import { useLocalized } from "./hooks";

let mockPageLocale: Locale = "en";

vi.mock("next-intl", () => ({
  useLocale: () => mockPageLocale,
}));

function Providers({ children }: { children: ReactNode }) {
  return <EditModeProvider>{children}</EditModeProvider>;
}

function LocalizedHarness() {
  const localized = useLocalized();
  const { enterEditMode, exitEditMode, setEditingLocale } = useEditMode();

  return (
    <div>
      <span data-testid="localized">
        {localized({ en: "Reflections", it: "Riflessioni" })}
      </span>
      <button data-testid="enter" onClick={enterEditMode} type="button">
        Enter
      </button>
      <button data-testid="exit" onClick={exitEditMode} type="button">
        Exit
      </button>
      <button
        data-testid="set-it"
        onClick={() => setEditingLocale("it")}
        type="button"
      >
        IT
      </button>
    </div>
  );
}

beforeEach(() => {
  mockPageLocale = "en";
  localStorage.clear();
});

afterEach(cleanup);

describe("useLocalized", () => {
  it("uses the page locale outside edit mode", () => {
    mockPageLocale = "it";

    render(
      <Providers>
        <LocalizedHarness />
      </Providers>
    );

    expect(screen.getByTestId("localized").textContent).toBe("Riflessioni");
  });

  it("uses the editing locale while edit mode is active", () => {
    render(
      <Providers>
        <LocalizedHarness />
      </Providers>
    );

    expect(screen.getByTestId("localized").textContent).toBe("Reflections");

    fireEvent.click(screen.getByTestId("enter"));
    fireEvent.click(screen.getByTestId("set-it"));

    expect(screen.getByTestId("localized").textContent).toBe("Riflessioni");

    fireEvent.click(screen.getByTestId("exit"));

    expect(screen.getByTestId("localized").textContent).toBe("Reflections");
  });
});
