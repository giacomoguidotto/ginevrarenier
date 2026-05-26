// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@clerk/nextjs", () => ({
  useClerk: () => ({ signOut: vi.fn() }),
}));

vi.mock("next-intl", () => ({
  useLocale: () => "en",
}));

vi.mock("./unsaved-changes-guard", () => ({
  useExitGuard: () => ({ requestExit: vi.fn() }),
}));

import { TooltipProvider } from "@/components/ui/tooltip";
import { EditModeProvider, useEditMode } from "./edit-mode-context";
import { EditToolbar } from "./edit-toolbar";

function EditModeToggle() {
  const { toggleEditMode, isEditMode } = useEditMode();
  return (
    <button data-testid="toggle" onClick={toggleEditMode} type="button">
      {isEditMode ? "on" : "off"}
    </button>
  );
}

function Providers({ children }: { children: ReactNode }) {
  return (
    <TooltipProvider>
      <EditModeProvider>{children}</EditModeProvider>
    </TooltipProvider>
  );
}

const emptySummary = () => ({
  autoTranslations: [],
  createdEntities: [],
  dismissals: [],
  imageSwaps: [],
  pendingDeletions: [],
  publishOverrides: [],
  selectionOverrides: [],
  reorderedEntityTypes: [],
  textEdits: [],
});

beforeEach(() => {
  localStorage.clear();
});
afterEach(cleanup);

describe("Locale toggle staleness dot", () => {
  it("shows a semantic dot when the non-active locale has stale fields", async () => {
    const staleFields = [
      { section: "hero", field: "title", locale: "it" },
      { section: "hero", field: "subtitle", locale: "it" },
    ];

    const { getByTestId } = render(
      <Providers>
        <EditModeToggle />
        <EditToolbar
          changeSummary={emptySummary}
          hasChanges={true}
          onDiscard={vi.fn()}
          onSave={vi.fn()}
          staleFields={staleFields}
        />
      </Providers>
    );

    await getByTestId("toggle").click();

    const dots = document.querySelectorAll('[data-slot="semantic-dot"]');
    expect(dots.length).toBeGreaterThanOrEqual(1);
  });

  it("does not show a dot when no stale fields exist", async () => {
    const { getByTestId } = render(
      <Providers>
        <EditModeToggle />
        <EditToolbar
          changeSummary={emptySummary}
          hasChanges={true}
          onDiscard={vi.fn()}
          onSave={vi.fn()}
          staleFields={[]}
        />
      </Providers>
    );

    await getByTestId("toggle").click();

    const dots = document.querySelectorAll('[data-slot="semantic-dot"]');
    expect(dots.length).toBe(0);
  });

  it("does not show dots when stale fields exist for both locales equally", async () => {
    const { getByTestId } = render(
      <Providers>
        <EditModeToggle />
        <EditToolbar
          changeSummary={emptySummary}
          hasChanges={true}
          onDiscard={vi.fn()}
          onSave={vi.fn()}
          staleFields={[]}
        />
      </Providers>
    );

    await getByTestId("toggle").click();

    const dots = document.querySelectorAll('[data-slot="semantic-dot"]');
    expect(dots.length).toBe(0);
  });

  it("shows dot only on the locale that has stale fields", async () => {
    const staleFields = [{ section: "hero", field: "title", locale: "it" }];

    const { getByTestId } = render(
      <Providers>
        <EditModeToggle />
        <EditToolbar
          changeSummary={emptySummary}
          hasChanges={true}
          onDiscard={vi.fn()}
          onSave={vi.fn()}
          staleFields={staleFields}
        />
      </Providers>
    );

    await getByTestId("toggle").click();

    const itLabel = screen.getByText("IT");
    const enLabel = screen.getByText("EN");

    const itDot = itLabel.parentElement?.querySelector(
      '[data-slot="semantic-dot"]'
    );
    const enDot = enLabel.parentElement?.querySelector(
      '[data-slot="semantic-dot"]'
    );

    expect(itDot).toBeTruthy();
    expect(enDot).toBeNull();
  });
});

describe("Save dialog staleness warning", () => {
  it("shows stale field warnings in the save confirmation dialog", async () => {
    const staleFields = [
      { section: "hero", field: "title", locale: "it" },
      { section: "hero", field: "subtitle", locale: "it" },
    ];
    const summaryWithEdits = () => ({
      ...emptySummary(),
      textEdits: [
        {
          section: "hero",
          field: "title",
          locale: "en",
          newValue: "Hello",
          oldValue: "Old",
        },
        {
          section: "hero",
          field: "subtitle",
          locale: "en",
          newValue: "Sub",
          oldValue: "Old Sub",
        },
      ],
    });

    const { getByTestId } = render(
      <Providers>
        <EditModeToggle />
        <EditToolbar
          changeSummary={summaryWithEdits}
          hasChanges={true}
          onDiscard={vi.fn()}
          onSave={vi.fn()}
          staleFields={staleFields}
        />
      </Providers>
    );

    await getByTestId("toggle").click();
    await screen.getByText("Save").click();

    expect(screen.getByText("2 undismissed stale fields:")).toBeTruthy();
  });
});
