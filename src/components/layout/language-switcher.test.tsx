// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next-intl", () => ({
  useLocale: () => "en",
}));

const mockReplace = vi.fn();
vi.mock("@/i18n/routing", () => ({
  useRouter: () => ({ replace: mockReplace }),
  usePathname: () => "/",
}));

vi.mock("./locale-toast", () => ({
  LOCALE_TOAST_STORAGE_KEY: "locale-toast-seen",
}));

import { LanguageSwitcher } from "./language-switcher";

afterEach(cleanup);

describe("LanguageSwitcher", () => {
  it("clicking an inactive locale triggers navigation", () => {
    render(<LanguageSwitcher />);

    const itButton = screen.getByRole("button", { current: false });
    fireEvent.click(itButton);

    expect(mockReplace).toHaveBeenCalledWith("/", { locale: "it" });
  });

  it("uses localeNames from config for aria-labels", async () => {
    const { locales, localeNames } = await import("@/i18n/config");
    render(<LanguageSwitcher />);

    for (const loc of locales) {
      const expectedLabel = `Switch to ${localeNames[loc]}`;
      expect(screen.getByLabelText(expectedLabel)).toBeDefined();
    }
  });

  it("marks the active locale with aria-current", () => {
    render(<LanguageSwitcher />);

    const activeButton = screen.getByRole("button", { current: true });
    expect(activeButton.textContent?.toLowerCase()).toBe("en");

    const inactiveButtons = screen.getAllByRole("button", { current: false });
    expect(inactiveButtons).toHaveLength(1);
    expect(inactiveButtons[0].textContent?.toLowerCase()).toBe("it");
  });

  it("renders a button for each locale in config", async () => {
    const { locales } = await import("@/i18n/config");
    render(<LanguageSwitcher />);

    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(locales.length);

    const buttonTexts = buttons.map((b) => b.textContent?.toLowerCase());
    for (const loc of locales) {
      expect(buttonTexts).toContain(loc);
    }
  });
});
