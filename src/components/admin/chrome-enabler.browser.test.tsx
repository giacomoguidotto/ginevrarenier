// @vitest-environment jsdom

import { act, cleanup, render } from "@testing-library/react";
import { useRef } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { ChromeEnablerProvider, useChromeEnabler } from "./chrome-enabler";

afterEach(cleanup);

function EnabledInspector() {
  const { enabled } = useChromeEnabler();
  return <div data-testid="enabled">{String(enabled)}</div>;
}

describe("ChromeEnablerProvider", () => {
  it("enabled starts false", () => {
    const { getByTestId } = render(
      <ChromeEnablerProvider>
        <EnabledInspector />
      </ChromeEnablerProvider>
    );

    expect(getByTestId("enabled").textContent).toBe("false");
  });

  it("enable() sets enabled to true", async () => {
    function Trigger() {
      const { enable } = useChromeEnabler();
      return (
        <button data-testid="enable" onClick={enable} type="button">
          enable
        </button>
      );
    }

    const { getByTestId } = render(
      <ChromeEnablerProvider>
        <EnabledInspector />
        <Trigger />
      </ChromeEnablerProvider>
    );

    expect(getByTestId("enabled").textContent).toBe("false");

    await act(() => {
      getByTestId("enable").click();
    });

    expect(getByTestId("enabled").textContent).toBe("true");
  });

  it("multiple enable() calls are idempotent (no extra re-renders)", async () => {
    function RenderCounter() {
      const renderCount = useRef(0);
      const { enabled, enable } = useChromeEnabler();
      renderCount.current += 1;
      return (
        <div>
          <span data-testid="renders">{renderCount.current}</span>
          <span data-testid="enabled-idem">{String(enabled)}</span>
          <button data-testid="enable-idem" onClick={enable} type="button">
            enable
          </button>
        </div>
      );
    }

    const { getByTestId } = render(
      <ChromeEnablerProvider>
        <RenderCounter />
      </ChromeEnablerProvider>
    );

    const rendersAfterMount = Number(getByTestId("renders").textContent);

    await act(() => {
      getByTestId("enable-idem").click();
    });

    const rendersAfterFirstEnable = Number(getByTestId("renders").textContent);
    expect(getByTestId("enabled-idem").textContent).toBe("true");
    expect(rendersAfterFirstEnable).toBe(rendersAfterMount + 1);

    await act(() => {
      getByTestId("enable-idem").click();
    });

    expect(Number(getByTestId("renders").textContent)).toBe(
      rendersAfterFirstEnable
    );
  });

  it("nested providers independently track their own enabled state", async () => {
    function Trigger({ testId }: { testId: string }) {
      const { enable } = useChromeEnabler();
      return (
        <button data-testid={testId} onClick={enable} type="button">
          enable
        </button>
      );
    }

    function Inspector({ testId }: { testId: string }) {
      const { enabled } = useChromeEnabler();
      return <div data-testid={testId}>{String(enabled)}</div>;
    }

    const { getByTestId } = render(
      <ChromeEnablerProvider>
        <Inspector testId="outer" />
        <Trigger testId="enable-outer" />
        <ChromeEnablerProvider>
          <Inspector testId="inner" />
          <Trigger testId="enable-inner" />
        </ChromeEnablerProvider>
      </ChromeEnablerProvider>
    );

    expect(getByTestId("outer").textContent).toBe("false");
    expect(getByTestId("inner").textContent).toBe("false");

    await act(() => {
      getByTestId("enable-inner").click();
    });

    expect(getByTestId("inner").textContent).toBe("true");
    expect(getByTestId("outer").textContent).toBe("false");

    await act(() => {
      getByTestId("enable-outer").click();
    });

    expect(getByTestId("outer").textContent).toBe("true");
    expect(getByTestId("inner").textContent).toBe("true");
  });
});
