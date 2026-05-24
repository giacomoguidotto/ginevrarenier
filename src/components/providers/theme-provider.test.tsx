// @vitest-environment jsdom

import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

let capturedProps: Record<string, unknown> = {};

vi.mock("next-themes", () => ({
  ThemeProvider: (props: Record<string, unknown>) => {
    capturedProps = props;
    return props.children;
  },
}));

import { ThemeProvider } from "./theme-provider";

afterEach(() => {
  cleanup();
  capturedProps = {};
});

describe("ThemeProvider", () => {
  it('defaults to "system" so the site respects OS prefers-color-scheme', () => {
    render(
      <ThemeProvider>
        <span />
      </ThemeProvider>
    );
    expect(capturedProps.defaultTheme).toBe("system");
  });

  it("enables system preference detection", () => {
    render(
      <ThemeProvider>
        <span />
      </ThemeProvider>
    );
    expect(capturedProps.enableSystem).toBe(true);
  });

  it('persists choice under "experience-theme" storage key', () => {
    render(
      <ThemeProvider>
        <span />
      </ThemeProvider>
    );
    expect(capturedProps.storageKey).toBe("experience-theme");
  });
});
