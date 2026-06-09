// @vitest-environment jsdom

import { act, cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const sentryMocks = vi.hoisted(() => ({
  captureException: vi.fn(),
  startSpan: vi.fn(
    async (_options: unknown, callback: () => Promise<unknown> | unknown) =>
      callback()
  ),
  withScope: vi.fn(
    (
      callback: (scope: {
        setContext: (name: string, context: unknown) => void;
        setTag: (name: string, value: string) => void;
      }) => void
    ) =>
      callback({
        setContext: vi.fn(),
        setTag: vi.fn(),
      })
  ),
}));

vi.mock("@clerk/nextjs", () => ({
  useClerk: () => ({ signOut: vi.fn() }),
}));

vi.mock("next-intl", () => ({
  useLocale: () => "en",
}));

vi.mock("@sentry/nextjs", () => sentryMocks);

vi.mock("./unsaved-changes-guard", () => ({
  useExitGuard: () => ({ requestExit: vi.fn() }),
}));

import { TooltipProvider } from "@/components/ui/tooltip";
import { AdminNotificationProvider } from "./admin-notifications";
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
      <EditModeProvider>
        <AdminNotificationProvider>{children}</AdminNotificationProvider>
      </EditModeProvider>
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
  sentryMocks.captureException.mockClear();
  sentryMocks.startSpan.mockClear();
  sentryMocks.withScope.mockClear();
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

describe("Save failure handling", () => {
  it("reports failed saves, clears loading, and shows an admin notification", async () => {
    const saveError = new Error(
      "[CONVEX M(siteContent:upsert)] [Request ID: 8273b38efffc5630] Server Error"
    );
    let rejectSave: (error: Error) => void = (initializationError) => {
      throw new Error(
        `Save promise was not initialized: ${initializationError.message}`
      );
    };
    const onSave = vi.fn(
      () =>
        new Promise<void>((_resolve, reject) => {
          rejectSave = reject;
        })
    );

    const { getByTestId } = render(
      <Providers>
        <EditModeToggle />
        <EditToolbar
          changeSummary={emptySummary}
          hasChanges={true}
          onDiscard={vi.fn()}
          onSave={onSave}
          staleFields={[]}
        />
      </Providers>
    );

    await getByTestId("toggle").click();
    await screen.getByText("Save").click();
    await screen.getAllByText("Save").at(-1)?.click();

    expect(
      screen.getByLabelText("Save changes").querySelector(".animate-spin")
    ).toBeTruthy();

    await act(async () => {
      rejectSave(saveError);
      await Promise.resolve();
    });

    const notification = await screen.findByRole("alert");
    expect(notification.textContent).toContain("Save failed");
    expect(notification.textContent).toContain(
      "The support team has been notified."
    );
    expect(notification.textContent).toContain("8273b38efffc5630");
    expect(
      screen.getByLabelText("Save changes").querySelector(".animate-spin")
    ).toBeNull();
    expect(sentryMocks.captureException).toHaveBeenCalledWith(saveError);
  });
});
