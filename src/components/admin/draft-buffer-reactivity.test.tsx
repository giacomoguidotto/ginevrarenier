// @vitest-environment jsdom

import { act, cleanup, render } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("convex/react", () => ({
  useConvexAuth: () => ({ isAuthenticated: true, isLoading: false }),
  useQuery: () => undefined,
  useMutation: () => vi.fn(),
}));

vi.mock("next-intl", () => ({
  useLocale: () => "en",
}));

import { DRAFT_BUFFER_VERSION } from "./draft-buffer";
import {
  DraftBufferProvider,
  useDraftBufferOps,
  useDraftBufferState,
  useEditVersion,
} from "./draft-buffer-context";
import { EditModeProvider } from "./edit-mode-context";

beforeEach(() => {
  localStorage.clear();
});
afterEach(cleanup);

function Providers({ children }: { children: ReactNode }) {
  return (
    <EditModeProvider>
      <DraftBufferProvider>{children}</DraftBufferProvider>
    </EditModeProvider>
  );
}

function DeletionTestComponent() {
  const { isPendingDeletion, trackDeletion, cancelDeletion } =
    useDraftBufferOps();
  useEditVersion();

  const pending = isPendingDeletion("project", "test-id");

  return (
    <div>
      <span data-testid="status">{pending ? "pending" : "active"}</span>
      <button
        data-testid="delete"
        onClick={() => trackDeletion("project", "test-id")}
        type="button"
      >
        Delete
      </button>
      <button
        data-testid="cancel"
        onClick={() => cancelDeletion("project", "test-id")}
        type="button"
      >
        Cancel
      </button>
    </div>
  );
}

function PublishTestComponent() {
  const { getPublishOverride, setPublishOverride, clearPublishOverride } =
    useDraftBufferOps();
  useEditVersion();

  const override = getPublishOverride("project", "test-id");
  let label: string;
  if (override === undefined) {
    label = "none";
  } else {
    label = override ? "publish" : "unpublish";
  }

  return (
    <div>
      <span data-testid="publish-status">{label}</span>
      <button
        data-testid="set-publish"
        onClick={() => setPublishOverride("project", "test-id", true)}
        type="button"
      >
        Publish
      </button>
      <button
        data-testid="set-unpublish"
        onClick={() => setPublishOverride("project", "test-id", false)}
        type="button"
      >
        Unpublish
      </button>
      <button
        data-testid="clear-publish"
        onClick={() => clearPublishOverride("project", "test-id")}
        type="button"
      >
        Clear
      </button>
    </div>
  );
}

describe("DraftBuffer reactivity — deletion", () => {
  it("trackDeletion makes isPendingDeletion return true after re-render", () => {
    const { getByTestId } = render(
      <Providers>
        <DeletionTestComponent />
      </Providers>
    );

    expect(getByTestId("status").textContent).toBe("active");

    act(() => {
      getByTestId("delete").click();
    });

    expect(getByTestId("status").textContent).toBe("pending");
  });

  it("cancelDeletion reverts isPendingDeletion to false", () => {
    const { getByTestId } = render(
      <Providers>
        <DeletionTestComponent />
      </Providers>
    );

    act(() => {
      getByTestId("delete").click();
    });
    expect(getByTestId("status").textContent).toBe("pending");

    act(() => {
      getByTestId("cancel").click();
    });
    expect(getByTestId("status").textContent).toBe("active");
  });
});

describe("DraftBuffer reactivity — publish override", () => {
  it("setPublishOverride updates getPublishOverride", () => {
    const { getByTestId } = render(
      <Providers>
        <PublishTestComponent />
      </Providers>
    );

    expect(getByTestId("publish-status").textContent).toBe("none");

    act(() => {
      getByTestId("set-publish").click();
    });
    expect(getByTestId("publish-status").textContent).toBe("publish");

    act(() => {
      getByTestId("set-unpublish").click();
    });
    expect(getByTestId("publish-status").textContent).toBe("unpublish");
  });

  it("clearPublishOverride reverts to undefined", () => {
    const { getByTestId } = render(
      <Providers>
        <PublishTestComponent />
      </Providers>
    );

    act(() => {
      getByTestId("set-publish").click();
    });
    expect(getByTestId("publish-status").textContent).toBe("publish");

    act(() => {
      getByTestId("clear-publish").click();
    });
    expect(getByTestId("publish-status").textContent).toBe("none");
  });
});

describe("DraftBuffer reactivity — parent-to-child prop chain", () => {
  function ChildCard({
    pendingDeletion,
    onDelete,
    onCancelDeletion,
  }: {
    pendingDeletion?: boolean;
    onDelete?: () => void;
    onCancelDeletion?: () => void;
  }) {
    const { getPublishOverride, setPublishOverride, clearPublishOverride } =
      useDraftBufferOps();
    useEditVersion();

    const publishOverride = getPublishOverride("project", "chain-id");
    const effectivePublished =
      publishOverride === undefined ? false : publishOverride;

    return (
      <div>
        <span data-testid="chain-deletion">
          {pendingDeletion ? "pending" : "active"}
        </span>
        <span data-testid="chain-publish">
          {publishOverride === undefined
            ? "none"
            : String(publishOverride ? "publish" : "unpublish")}
        </span>

        {pendingDeletion && onCancelDeletion ? (
          <button
            data-testid="chain-cancel"
            onClick={onCancelDeletion}
            type="button"
          >
            Cancel deletion
          </button>
        ) : null}

        {pendingDeletion ? null : (
          <div>
            {onDelete ? (
              <button
                data-testid="chain-delete"
                onClick={onDelete}
                type="button"
              >
                Delete
              </button>
            ) : null}
            <button
              data-testid="chain-toggle-publish"
              onClick={() => {
                const target = !effectivePublished;
                if (target === false) {
                  clearPublishOverride("project", "chain-id");
                } else {
                  setPublishOverride("project", "chain-id", target);
                }
              }}
              type="button"
            >
              {effectivePublished ? "Unpublish" : "Publish"}
            </button>
          </div>
        )}
      </div>
    );
  }

  function ParentCard() {
    const { isPendingDeletion, trackDeletion, cancelDeletion } =
      useDraftBufferOps();
    useEditVersion();

    const pendingDeletion = isPendingDeletion("project", "chain-id");

    return (
      <ChildCard
        onCancelDeletion={() => cancelDeletion("project", "chain-id")}
        onDelete={() => trackDeletion("project", "chain-id")}
        pendingDeletion={pendingDeletion}
      />
    );
  }

  it("delete button click in child triggers parent re-render and updates child props", () => {
    const { getByTestId, queryByTestId } = render(
      <Providers>
        <ParentCard />
      </Providers>
    );

    expect(getByTestId("chain-deletion").textContent).toBe("active");
    expect(queryByTestId("chain-delete")).toBeTruthy();
    expect(queryByTestId("chain-cancel")).toBeNull();

    act(() => {
      getByTestId("chain-delete").click();
    });

    expect(getByTestId("chain-deletion").textContent).toBe("pending");
    expect(queryByTestId("chain-delete")).toBeNull();
    expect(queryByTestId("chain-cancel")).toBeTruthy();
  });

  it("cancel deletion in child reverts parent state", () => {
    const { getByTestId, queryByTestId } = render(
      <Providers>
        <ParentCard />
      </Providers>
    );

    act(() => {
      getByTestId("chain-delete").click();
    });
    expect(getByTestId("chain-deletion").textContent).toBe("pending");

    act(() => {
      getByTestId("chain-cancel").click();
    });
    expect(getByTestId("chain-deletion").textContent).toBe("active");
    expect(queryByTestId("chain-delete")).toBeTruthy();
  });

  it("publish toggle in child updates via direct buffer read", () => {
    const { getByTestId } = render(
      <Providers>
        <ParentCard />
      </Providers>
    );

    expect(getByTestId("chain-publish").textContent).toBe("none");

    act(() => {
      getByTestId("chain-toggle-publish").click();
    });

    expect(getByTestId("chain-publish").textContent).toBe("publish");
  });
});

function HasChangesProbe() {
  const { hasChanges } = useDraftBufferState();
  return <span data-testid="has-changes">{String(hasChanges)}</span>;
}

function KeepDraftProbe() {
  const { keepDraft } = useDraftBufferState();
  const { write } = useDraftBufferOps();
  return (
    <button
      data-testid="keep-draft"
      onClick={() => {
        write("hero", "title", "en", "Kept draft");
        keepDraft();
      }}
      type="button"
    >
      Keep
    </button>
  );
}

function persistBuffer(buffer: Record<string, unknown>) {
  localStorage.setItem(
    "draft-buffer-state",
    JSON.stringify({ buffer, imageAssets: [] })
  );
}

const bufferWithEdits = {
  store: [["hero\0title\0en", "Hello"]],
  creations: [],
  deletions: [],
  publishOverrides: [],
  reorderLists: [],
  dismissals: [],
  autoTranslations: [],
};

describe("DraftBuffer — version gating on localStorage hydration", () => {
  it("discards legacy v1 buffer (no version field)", () => {
    persistBuffer(bufferWithEdits);

    const { getByTestId } = render(
      <Providers>
        <HasChangesProbe />
      </Providers>
    );

    expect(getByTestId("has-changes").textContent).toBe("false");
  });

  it("discards buffer with mismatched version", () => {
    persistBuffer({ ...bufferWithEdits, version: 99 });

    const { getByTestId } = render(
      <Providers>
        <HasChangesProbe />
      </Providers>
    );

    expect(getByTestId("has-changes").textContent).toBe("false");
  });

  it("accepts buffer with current version", () => {
    persistBuffer({ ...bufferWithEdits, version: DRAFT_BUFFER_VERSION });

    const { getByTestId } = render(
      <Providers>
        <HasChangesProbe />
      </Providers>
    );

    expect(getByTestId("has-changes").textContent).toBe("true");
  });

  it("accepts a current draft even when edit mode is not active", () => {
    localStorage.removeItem("edit-mode-active");
    persistBuffer({ ...bufferWithEdits, version: DRAFT_BUFFER_VERSION });

    const { getByTestId } = render(
      <Providers>
        <HasChangesProbe />
      </Providers>
    );

    expect(getByTestId("has-changes").textContent).toBe("true");
  });

  it("flushes kept drafts immediately", () => {
    const { getByTestId } = render(
      <Providers>
        <KeepDraftProbe />
      </Providers>
    );

    act(() => {
      getByTestId("keep-draft").click();
    });

    const persisted = JSON.parse(
      localStorage.getItem("draft-buffer-state") ?? "{}"
    );
    expect(persisted.buffer.store).toEqual([["hero\0title\0en", "Kept draft"]]);
  });
});
