// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const draftMocks = vi.hoisted(() => ({
  discard: vi.fn(async () => undefined),
  keepDraft: vi.fn(),
  save: vi.fn(async () => undefined),
}));

const editModeMocks = vi.hoisted(() => ({
  exitEditMode: vi.fn(),
}));

const operationMocks = vi.hoisted(() => ({
  failNext: false,
  run: vi.fn(
    async (_options: unknown, operation: () => Promise<unknown> | unknown) => {
      if (operationMocks.failNext) {
        return { error: new Error("Auth expired"), ok: false };
      }
      return { ok: true, value: await operation() };
    }
  ),
}));

vi.mock("./draft-buffer-context", () => ({
  useDraftBufferState: () => ({
    discard: draftMocks.discard,
    hasChanges: true,
    keepDraft: draftMocks.keepDraft,
    save: draftMocks.save,
  }),
}));

vi.mock("./edit-mode-context", () => ({
  useEditMode: () => ({
    exitEditMode: editModeMocks.exitEditMode,
  }),
}));

vi.mock("./use-admin-operation", () => ({
  useAdminOperation: () => operationMocks.run,
}));

import { UnsavedChangesGuard, useExitGuard } from "./unsaved-changes-guard";

beforeEach(() => {
  draftMocks.discard.mockClear();
  draftMocks.keepDraft.mockClear();
  draftMocks.save.mockClear();
  editModeMocks.exitEditMode.mockClear();
  operationMocks.failNext = false;
  operationMocks.run.mockClear();
});

afterEach(cleanup);

function ExitRequester({ onExit }: { onExit: () => void }) {
  const { requestExit } = useExitGuard();
  return (
    <button onClick={() => requestExit(onExit)} type="button">
      Exit
    </button>
  );
}

describe("UnsavedChangesGuard", () => {
  it("keeps the draft locally without saving or discarding", async () => {
    const onExit = vi.fn();

    render(
      <UnsavedChangesGuard>
        <ExitRequester onExit={onExit} />
      </UnsavedChangesGuard>
    );

    await screen.getByRole("button", { name: "Exit" }).click();
    await screen.getByRole("button", { name: "Keep draft" }).click();

    expect(draftMocks.keepDraft).toHaveBeenCalledTimes(1);
    expect(editModeMocks.exitEditMode).toHaveBeenCalledTimes(1);
    expect(onExit).toHaveBeenCalledTimes(1);
    expect(draftMocks.save).not.toHaveBeenCalled();
    expect(draftMocks.discard).not.toHaveBeenCalled();
    expect(operationMocks.run).not.toHaveBeenCalled();
  });

  it("keeps the draft when save-and-exit fails", async () => {
    operationMocks.failNext = true;
    const onExit = vi.fn();

    render(
      <UnsavedChangesGuard>
        <ExitRequester onExit={onExit} />
      </UnsavedChangesGuard>
    );

    await screen.getByRole("button", { name: "Exit" }).click();
    await screen.getByRole("button", { name: "Save" }).click();

    expect(draftMocks.keepDraft).toHaveBeenCalledTimes(1);
    expect(editModeMocks.exitEditMode).not.toHaveBeenCalled();
    expect(onExit).not.toHaveBeenCalled();
  });
});
