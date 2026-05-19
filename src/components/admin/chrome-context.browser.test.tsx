// @vitest-environment jsdom

import { act, cleanup, render } from "@testing-library/react";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ChromeProvider,
  useChromeDismount,
  useChromeRegister,
  useChromeRegistry,
} from "./chrome-context";
import { ChromeEnablerProvider, useChromeEnabler } from "./chrome-enabler";
import { EditModeProvider, useEditMode } from "./edit-mode-context";
import { Section } from "./section";

vi.mock("next-intl", () => ({
  useLocale: () => "en",
}));

vi.mock("./section", () => {
  const React = require("react");
  const SectionContext = React.createContext({ name: "hero", data: undefined });
  return {
    Section: ({ name, children }: { name: string; children: ReactNode }) =>
      React.createElement(
        SectionContext.Provider,
        { value: { name, data: undefined } },
        children
      ),
    useSection: () => React.useContext(SectionContext),
  };
});

beforeEach(() => localStorage.clear());
afterEach(cleanup);

function Providers({ children }: { children: ReactNode }) {
  return (
    <EditModeProvider>
      <ChromeProvider>{children}</ChromeProvider>
    </EditModeProvider>
  );
}

function FieldWithRegistration({ name }: { name: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useChromeRegister(name, ref);
  return (
    <div data-testid={`field-${name}`} ref={ref}>
      content
    </div>
  );
}

function EditModeToggle() {
  const { toggleEditMode, isEditMode } = useEditMode();
  return (
    <button data-testid="toggle" onClick={toggleEditMode} type="button">
      {isEditMode ? "on" : "off"}
    </button>
  );
}

function VisibleCountInspector({ onCount }: { onCount: (n: number) => void }) {
  const registry = useChromeRegistry();
  useEffect(() => {
    const check = () => {
      const visible = registry.getAll().filter((f) => f.visible).length;
      onCount(visible);
    };
    check();
    return registry.subscribe(check);
  }, [registry, onCount]);
  return null;
}

function RegistryInspector({ onCount }: { onCount: (n: number) => void }) {
  const registry = useChromeRegistry();
  useEffect(() => {
    const unsub = registry.subscribe(() => {
      onCount(registry.getAll().length);
    });
    return unsub;
  }, [registry, onCount]);
  return null;
}

function ChromeDismountOnPathChange({ path }: { path: string }) {
  useChromeDismount(path);
  return null;
}

describe("Chrome Context", () => {
  function TestHarness({ fieldNames = ["title"] }: { fieldNames?: string[] }) {
    const [count, setCount] = useState(0);
    return (
      <Providers>
        <Section name="hero">
          <RegistryInspector onCount={setCount} />
          <EditModeToggle />
          {fieldNames.map((n) => (
            <FieldWithRegistration key={n} name={n} />
          ))}
          <div data-testid="count">{count}</div>
        </Section>
      </Providers>
    );
  }

  it("registers fields when edit mode is on", async () => {
    const { getByTestId } = render(<TestHarness />);
    expect(getByTestId("count").textContent).toBe("0");

    await act(() => {
      getByTestId("toggle").click();
    });

    expect(getByTestId("count").textContent).toBe("1");
  });

  it("deregisters fields when edit mode is off", async () => {
    const { getByTestId } = render(<TestHarness />);

    await act(() => {
      getByTestId("toggle").click();
    });
    expect(getByTestId("count").textContent).toBe("1");

    await act(() => {
      getByTestId("toggle").click();
    });
    expect(getByTestId("count").textContent).toBe("0");
  });

  it("registers multiple fields", async () => {
    const { getByTestId } = render(
      <TestHarness fieldNames={["title", "subtitle", "cta"]} />
    );

    await act(() => {
      getByTestId("toggle").click();
    });

    expect(getByTestId("count").textContent).toBe("3");
  });

  it("deregisters on unmount", async () => {
    function Togglable() {
      const [show, setShow] = useState(true);
      const [count, setCount] = useState(0);
      return (
        <Providers>
          <Section name="hero">
            <RegistryInspector onCount={setCount} />
            <EditModeToggle />
            {show && <FieldWithRegistration name="title" />}
            <button
              data-testid="remove"
              onClick={() => setShow(false)}
              type="button"
            >
              remove
            </button>
            <div data-testid="count">{count}</div>
          </Section>
        </Providers>
      );
    }

    const { getByTestId } = render(<Togglable />);

    await act(() => {
      getByTestId("toggle").click();
    });
    expect(getByTestId("count").textContent).toBe("1");

    await act(() => {
      getByTestId("remove").click();
    });
    expect(getByTestId("count").textContent).toBe("0");
  });
});

describe("Chrome Dismount on Navigate", () => {
  it("persistent fields re-register after dismountAll on navigation", async () => {
    function DismountHarness() {
      const [count, setCount] = useState(0);
      const [path, setPath] = useState("/");
      return (
        <Providers>
          <Section name="hero">
            <RegistryInspector onCount={setCount} />
            <EditModeToggle />
            <FieldWithRegistration name="title" />
            <ChromeDismountOnPathChange path={path} />
            <button
              data-testid="navigate"
              onClick={() => setPath("/about")}
              type="button"
            >
              navigate
            </button>
            <div data-testid="count">{count}</div>
          </Section>
        </Providers>
      );
    }

    const { getByTestId } = render(<DismountHarness />);

    await act(() => {
      getByTestId("toggle").click();
    });
    expect(getByTestId("count").textContent).toBe("1");

    await act(() => {
      getByTestId("navigate").click();
    });
    expect(getByTestId("count").textContent).toBe("1");
  });
});

describe("Chrome Enabler", () => {
  function AnimationTrigger() {
    const { enable } = useChromeEnabler();
    return (
      <button data-testid="animate-complete" onClick={enable} type="button">
        complete animation
      </button>
    );
  }

  it("field is not visible until animation completes", async () => {
    function Harness() {
      const [vc, setVc] = useState(0);
      return (
        <Providers>
          <Section name="hero">
            <VisibleCountInspector onCount={setVc} />
            <EditModeToggle />
            <ChromeEnablerProvider>
              <AnimationTrigger />
              <FieldWithRegistration name="title" />
            </ChromeEnablerProvider>
            <div data-testid="visible-count">{vc}</div>
          </Section>
        </Providers>
      );
    }

    const { getByTestId } = render(<Harness />);

    await act(() => {
      getByTestId("toggle").click();
    });
    expect(getByTestId("visible-count").textContent).toBe("0");

    await act(() => {
      getByTestId("animate-complete").click();
    });
    expect(getByTestId("visible-count").textContent).toBe("1");
  });

  it("field without chrome enabler provider defaults to visible", async () => {
    function Harness() {
      const [vc, setVc] = useState(0);
      return (
        <Providers>
          <Section name="hero">
            <VisibleCountInspector onCount={setVc} />
            <EditModeToggle />
            <FieldWithRegistration name="title" />
            <div data-testid="visible-count">{vc}</div>
          </Section>
        </Providers>
      );
    }

    const { getByTestId } = render(<Harness />);

    await act(() => {
      getByTestId("toggle").click();
    });
    expect(getByTestId("visible-count").textContent).toBe("1");
  });
});
