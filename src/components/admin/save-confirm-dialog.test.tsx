// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ChangeSummary } from "./draft-buffer";
import { SaveConfirmDialog } from "./edit-toolbar";

const STALE_FIELD_RE = /undismissed stale field/;
const ABC_YEAR_RE = /abc\.year/;
const TIMELINE_ENTRY_RE = /Timeline Entry/;
const TMP_YEAR_RE = /tmp\.year/;

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

  it("shows green line for created timeline entry and hides its text edits", () => {
    const summary = makeSummary({
      textEdits: [
        {
          section: "essence.timeline",
          field: "abc.year",
          locale: "en",
          newValue: "2026",
          oldValue: undefined,
        },
        {
          section: "essence.timeline",
          field: "abc.title",
          locale: "en",
          newValue: "",
          oldValue: undefined,
        },
      ],
      createdEntities: [{ entityType: "timeline-entry", id: "abc" }],
    });
    const labels = new Map([
      ["essence.timeline", "Essence: Timeline"],
      ["timeline-entry:abc", "Timeline Entry: 2026"],
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

    expect(screen.getByText("New Timeline Entry: 2026")).toBeTruthy();
    expect(screen.queryByText(ABC_YEAR_RE)).toBeNull();
  });

  it("shows red line for deleted timeline entry", () => {
    const summary = makeSummary({
      pendingDeletions: [{ entityType: "timeline-entry", id: "xyz" }],
    });
    const labels = new Map([["timeline-entry:xyz", "Timeline Entry: 2020"]]);

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

    const items = screen.getAllByText(
      (_content, el) => el?.textContent === "Delete Timeline Entry: 2020"
    );
    expect(items.length).toBeGreaterThan(0);
    expect(
      items.some((el) =>
        el.closest("li")?.classList.contains("text-destructive")
      )
    ).toBe(true);
  });

  it("hides timeline entries that are both created and deleted", () => {
    const summary = makeSummary({
      textEdits: [
        {
          section: "essence.timeline",
          field: "tmp.year",
          locale: "en",
          newValue: "2026",
          oldValue: undefined,
        },
      ],
      createdEntities: [{ entityType: "timeline-entry", id: "tmp" }],
      pendingDeletions: [{ entityType: "timeline-entry", id: "tmp" }],
    });
    const labels = new Map([["timeline-entry:tmp", "Timeline Entry: 2026"]]);

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

    expect(screen.queryByText(TIMELINE_ENTRY_RE)).toBeNull();
    expect(screen.queryByText(TMP_YEAR_RE)).toBeNull();
  });

  it("shows new photo with parent context", () => {
    const summary = makeSummary({
      createdEntities: [{ entityType: "photo", id: "img1" }],
    });
    const labels = new Map([["photo:img1", "Photo in Venetian Light"]]);

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

    expect(screen.getByText("New Photo in Venetian Light")).toBeTruthy();
  });

  it("shows photo deletion with parent context", () => {
    const summary = makeSummary({
      pendingDeletions: [{ entityType: "photo", id: "img2" }],
    });
    const labels = new Map([["photo:img2", "Photo in Venetian Light"]]);

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

    const items = screen.getAllByText(
      (_content, el) => el?.textContent === "Delete Photo in Venetian Light"
    );
    expect(items.length).toBeGreaterThan(0);
  });

  it("shows photo reorder with arrow icon", () => {
    const summary = makeSummary({
      reorderedEntityTypes: ["photo"],
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

    const items = screen.getAllByText(
      (_content, el) => el?.textContent === "Reorder Photos"
    );
    expect(items.length).toBeGreaterThan(0);
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
