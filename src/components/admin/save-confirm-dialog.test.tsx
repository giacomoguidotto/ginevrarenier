// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ChangeSummary } from "./draft-buffer";
import { SaveConfirmDialog } from "./edit-toolbar";

const STALE_FIELD_RE = /undismissed stale field/;

afterEach(cleanup);

function makeSummary(overrides: Partial<ChangeSummary> = {}): ChangeSummary {
  return {
    textEdits: [],
    imageSwaps: [],
    createdEntities: [],
    pendingDeletions: [],
    fieldDeletions: [],
    publishOverrides: [],
    reorderedEntityTypes: [],
    dismissals: [],
    autoTranslations: [],
    ...overrides,
  };
}

describe("SaveConfirmDialog", () => {
  it("renders human-readable labels for text edits", () => {
    const summary = makeSummary({
      textEdits: [
        {
          section: "hero",
          field: "title",
          locale: "en",
          newValue: "Hello",
          oldValue: undefined,
        },
      ],
    });
    const labels = new Map([["hero", "Hero Section"]]);

    render(
      <SaveConfirmDialog
        changeSummary={() => summary}
        loading={false}
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
        open
        sectionLabels={labels}
      />
    );

    expect(screen.getByText("Hero Section / title")).toBeTruthy();
  });

  it("renders entity section with registered entity label", () => {
    const summary = makeSummary({
      textEdits: [
        {
          section: "project:abc123",
          field: "title",
          locale: "en",
          newValue: "New name",
          oldValue: undefined,
        },
      ],
    });
    const labels = new Map([["project:abc123", "Project: Solstice"]]);

    render(
      <SaveConfirmDialog
        changeSummary={() => summary}
        loading={false}
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
        open
        sectionLabels={labels}
      />
    );

    expect(screen.getByText("Project: Solstice / title")).toBeTruthy();
  });

  it("shows precise undismissed stale field count", () => {
    const summary = makeSummary({
      textEdits: [
        {
          section: "hero",
          field: "title",
          locale: "en",
          newValue: "Hello",
          oldValue: undefined,
        },
        {
          section: "hero",
          field: "subtitle",
          locale: "en",
          newValue: "World",
          oldValue: undefined,
        },
      ],
    });
    const labels = new Map([["hero", "Hero Section"]]);

    render(
      <SaveConfirmDialog
        changeSummary={() => summary}
        loading={false}
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
        open
        sectionLabels={labels}
      />
    );

    expect(screen.getByText("2 undismissed stale fields:")).toBeTruthy();
  });

  it("shows singular form for one stale field", () => {
    const summary = makeSummary({
      textEdits: [
        {
          section: "hero",
          field: "title",
          locale: "en",
          newValue: "Hello",
          oldValue: undefined,
        },
      ],
    });

    render(
      <SaveConfirmDialog
        changeSummary={() => summary}
        loading={false}
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
        open
        sectionLabels={new Map()}
      />
    );

    expect(screen.getByText("1 undismissed stale field:")).toBeTruthy();
  });

  it("excludes dismissed fields from stale warning", () => {
    const summary = makeSummary({
      textEdits: [
        {
          section: "hero",
          field: "title",
          locale: "en",
          newValue: "Hello",
          oldValue: undefined,
        },
      ],
      dismissals: [{ section: "hero", field: "title", locale: "it" }],
    });

    render(
      <SaveConfirmDialog
        changeSummary={() => summary}
        loading={false}
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
        open
        sectionLabels={new Map()}
      />
    );

    expect(screen.queryByText(STALE_FIELD_RE)).toBeNull();
  });

  it("save button is enabled even with stale warnings", () => {
    const summary = makeSummary({
      textEdits: [
        {
          section: "hero",
          field: "title",
          locale: "en",
          newValue: "Hello",
          oldValue: undefined,
        },
      ],
    });

    render(
      <SaveConfirmDialog
        changeSummary={() => summary}
        loading={false}
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
        open
        sectionLabels={new Map()}
      />
    );

    expect(screen.getByText(STALE_FIELD_RE)).toBeTruthy();
    const saveBtn = screen.getByRole("button", { name: "Save" });
    expect((saveBtn as HTMLButtonElement).disabled).toBe(false);
  });

  it("lists each undismissed stale field with human-readable label", () => {
    const summary = makeSummary({
      textEdits: [
        {
          section: "hero",
          field: "title",
          locale: "en",
          newValue: "Hello",
          oldValue: undefined,
        },
        {
          section: "project:abc123",
          field: "description",
          locale: "it",
          newValue: "Desc",
          oldValue: undefined,
        },
      ],
    });
    const labels = new Map([
      ["hero", "Hero Section"],
      ["project:abc123", "Project: Solstice"],
    ]);

    render(
      <SaveConfirmDialog
        changeSummary={() => summary}
        loading={false}
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
        open
        sectionLabels={labels}
      />
    );

    expect(screen.getByText("2 undismissed stale fields:")).toBeTruthy();
    expect(
      screen.getByText(
        (_content, el) =>
          el?.textContent === "IT missing for Hero Section / title"
      )
    ).toBeTruthy();
    expect(
      screen.getByText(
        (_content, el) =>
          el?.textContent === "EN missing for Project: Solstice / description"
      )
    ).toBeTruthy();
  });
});
