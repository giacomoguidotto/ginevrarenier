// @vitest-environment jsdom

import { cleanup, render } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@clerk/nextjs", () => ({
  useClerk: () => ({ signOut: vi.fn() }),
}));

vi.mock("next-intl", () => ({
  useLocale: () => "en",
}));

// biome-ignore lint/suspicious/noEmptyBlockStatements: noop stub
const saveMock = vi.fn(async () => {});
const discardMock = vi.fn();
let mockHasChanges = false;

vi.mock("./draft-buffer-context", () => ({
  DraftBufferProvider: ({ children }: { children: ReactNode }) => children,
  useDraftBufferOps: () => ({
    read: () => undefined,
    write: vi.fn(),
    editedLocales: () => new Set<string>(),
  }),
  useDraftBufferReset: () => 0,
  useEditVersion: () => 0,
  useDraftBufferState: () => ({
    hasChanges: mockHasChanges,
    save: saveMock,
    discard: discardMock,
    changeSummary: () => ({
      autoTranslations: [],
      createdEntities: [],
      dismissals: [],
      fieldDeletions: [],
      imageSwaps: [],
      pendingDeletions: [],
      publishOverrides: [],
      reorderedEntityTypes: [],
      textEdits: [],
    }),
  }),
}));

vi.mock("./page-changes-context", () => ({
  PageChangesProvider: ({ children }: { children: ReactNode }) => children,
  usePageChanges: () => ({
    hasChanges: false,
    // biome-ignore lint/suspicious/noEmptyBlockStatements: noop stub
    save: async () => {},
    // biome-ignore lint/suspicious/noEmptyBlockStatements: noop stub
    discard: () => {},
  }),
}));

import { TooltipProvider } from "@/components/ui/tooltip";
import { EditModeProvider, useEditMode } from "./edit-mode-context";
import { EditToolbarWrapper } from "./edit-toolbar-wrapper";

beforeEach(() => {
  localStorage.clear();
  mockHasChanges = false;
  saveMock.mockClear();
  discardMock.mockClear();
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

function Providers({ children }: { children: ReactNode }) {
  return (
    <TooltipProvider>
      <EditModeProvider>{children}</EditModeProvider>
    </TooltipProvider>
  );
}

describe("EditToolbarWrapper without PageChanges", () => {
  it("reports hasChanges from DraftBuffer only", async () => {
    mockHasChanges = true;

    const { getByTestId, getByText } = render(
      <Providers>
        <EditModeToggle />
        <EditToolbarWrapper />
      </Providers>
    );

    await getByTestId("toggle").click();

    expect(getByText("Save")).toBeTruthy();
    expect(getByText("Discard")).toBeTruthy();
  });

  it("does not import or depend on PageChangesProvider", async () => {
    const source = await import("./edit-toolbar-wrapper");
    const sourceText = source.EditToolbarWrapper.toString();
    expect(sourceText).not.toContain("pageChanges");
  });
});
