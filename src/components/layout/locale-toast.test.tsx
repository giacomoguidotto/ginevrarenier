// @vitest-environment jsdom

import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-intl", () => ({
  useLocale: () => mockPageLocale,
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/i18n/routing", () => ({
  usePathname: () => "/",
  useRouter: () => ({ replace: mockRouterReplace }),
}));

let mockPageLocale = "en";
const mockRouterReplace = vi.fn();

Object.defineProperty(globalThis, "navigator", {
  value: { languages: ["it-IT", "it"], language: "it-IT" },
  writable: true,
  configurable: true,
});

import { LocaleToast } from "./locale-toast";

beforeEach(() => {
  mockPageLocale = "en";
  localStorage.clear();
  mockRouterReplace.mockClear();
});
afterEach(cleanup);

describe("LocaleToast", () => {
  it("does not render when localStorage flag is set", () => {
    localStorage.setItem("locale-toast-dismissed", "true");
    render(<LocaleToast />);
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("renders when locale mismatch is detected", () => {
    render(<LocaleToast />);
    expect(screen.getByRole("status")).toBeDefined();
  });

  it("does not render when page locale matches browser locale", () => {
    mockPageLocale = "it";
    render(<LocaleToast />);
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("writes localStorage flag after visible duration elapses", () => {
    vi.useFakeTimers();
    render(<LocaleToast />);
    expect(localStorage.getItem("locale-toast-dismissed")).toBeNull();

    act(() => vi.advanceTimersByTime(2000 + 8000));

    expect(localStorage.getItem("locale-toast-dismissed")).toBe("true");
    vi.useRealTimers();
  });

  it("navigates and writes flag when clicking the locale suggestion", () => {
    vi.useFakeTimers();
    render(<LocaleToast />);

    act(() => vi.advanceTimersByTime(2000));

    const link = screen.getByRole("button");
    fireEvent.click(link);

    expect(mockRouterReplace).toHaveBeenCalledWith("/", { locale: "it" });
    expect(localStorage.getItem("locale-toast-dismissed")).toBe("true");
    vi.useRealTimers();
  });
});
