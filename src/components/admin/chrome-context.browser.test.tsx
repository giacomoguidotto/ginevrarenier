// @vitest-environment jsdom
//
// Requires: bun add -D @testing-library/react @testing-library/jest-dom jsdom

import { cleanup, render, act } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { useRef, useEffect, useState } from "react";
import { ChromeProvider, useChromeRegister, useChromeRegistry } from "./chrome-context";
import { EditModeProvider, useEditMode } from "./edit-mode-context";

// Stub next-intl's useLocale since we're outside Next.js
vi.mock("next-intl", () => ({
  useLocale: () => "en",
}));

// Minimal Section context wrapper
vi.mock("./section", () => {
  const { createContext, useContext } = require("react");
  const SectionContext = createContext({ name: "hero", data: undefined });
  return {
    Section: ({ name, children }: { name: string; children: ReactNode }) => (
      <SectionContext.Provider value={{ name, data: undefined }}>
        {children}
      </SectionContext.Provider>
    ),
    useSection: () => useContext(SectionContext),
  };
});

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
  return <div ref={ref} data-testid={`field-${name}`}>content</div>;
}

function EditModeToggle() {
  const { toggleEditMode, isEditMode } = useEditMode();
  return (
    <button type="button" data-testid="toggle" onClick={toggleEditMode}>
      {isEditMode ? "on" : "off"}
    </button>
  );
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

describe("Chrome Context", () => {
  // Mock Section wrapper for field registration
  const { Section } = vi.mocked(await import("./section"));

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

    await act(async () => {
      getByTestId("toggle").click();
    });

    expect(getByTestId("count").textContent).toBe("1");
  });

  it("deregisters fields when edit mode is off", async () => {
    const { getByTestId } = render(<TestHarness />);

    await act(async () => {
      getByTestId("toggle").click();
    });
    expect(getByTestId("count").textContent).toBe("1");

    await act(async () => {
      getByTestId("toggle").click();
    });
    expect(getByTestId("count").textContent).toBe("0");
  });

  it("registers multiple fields", async () => {
    const { getByTestId } = render(
      <TestHarness fieldNames={["title", "subtitle", "cta"]} />,
    );

    await act(async () => {
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
              type="button"
              data-testid="remove"
              onClick={() => setShow(false)}
            >
              remove
            </button>
            <div data-testid="count">{count}</div>
          </Section>
        </Providers>
      );
    }

    const { getByTestId } = render(<Togglable />);

    await act(async () => {
      getByTestId("toggle").click();
    });
    expect(getByTestId("count").textContent).toBe("1");

    await act(async () => {
      getByTestId("remove").click();
    });
    expect(getByTestId("count").textContent).toBe("0");
  });
});
