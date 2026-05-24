// @vitest-environment jsdom

import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("framer-motion", () => ({
  motion: new Proxy(
    {},
    {
      get:
        (_target, prop) =>
        ({
          children,
          className,
          ...rest
        }: {
          children?: ReactNode;
          className?: string;
        } & Record<string, unknown>) => {
          const Tag = String(prop) as keyof HTMLElementTagNameMap;
          const htmlProps: Record<string, unknown> = {};
          for (const [key, value] of Object.entries(rest)) {
            if (
              key.startsWith("data-") ||
              key.startsWith("aria-") ||
              key === "href" ||
              key === "type" ||
              key === "disabled"
            ) {
              htmlProps[key] = value;
            }
          }
          // @ts-expect-error dynamic tag
          return (
            <Tag className={className} {...htmlProps}>
              {children}
            </Tag>
          );
        },
    }
  ),
  AnimatePresence: ({ children }: { children?: ReactNode }) => <>{children}</>,
}));

const mockMutate = vi.fn();
vi.mock("convex/react", () => ({
  useMutation: () => mockMutate,
}));

let mockLocale = "en";
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => `t:${key}`,
  useLocale: () => mockLocale,
}));

vi.mock("@/components/admin/field", () => ({
  Field: ({ name }: { name: string }) => (
    <span data-testid={`field-${name}`}>{name}</span>
  ),
}));

vi.mock("@/components/admin/section", () => ({
  Section: ({ children }: { children?: ReactNode }) => <>{children}</>,
}));

vi.mock("@/components/admin/chrome-enabler", () => ({
  ChromeEnablerProvider: ({ children }: { children?: ReactNode }) => (
    <>{children}</>
  ),
  useChromeEnabler: () => ({ enable: vi.fn(), enabled: true }),
}));

import { SubscribeForm } from "./subscribe-form";

const EMAIL_NAME = /email/i;
const SUBMIT_NAME = /t:submit/i;
const CONSENT_RE = /t:consent/i;
const SUCCESS_RE = /t:success/i;
function getForm() {
  const input = screen.getByRole("textbox", { name: EMAIL_NAME });
  const form = input.closest("form");
  if (!form) {
    throw new Error("form not found");
  }
  return { input, form };
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  mockLocale = "en";
});

describe("SubscribeForm", () => {
  it("renders email input, submit button, and consent text", () => {
    render(<SubscribeForm sectionName="home.subscribe" />);

    expect(screen.getByRole("textbox", { name: EMAIL_NAME })).toBeDefined();
    expect(screen.getByRole("button", { name: SUBMIT_NAME })).toBeDefined();
    expect(screen.getByText(CONSENT_RE)).toBeDefined();
  });

  it("renders creative prompt as an admin-editable Field", () => {
    render(<SubscribeForm sectionName="home.subscribe" />);

    expect(screen.getByTestId("field-prompt")).toBeDefined();
  });

  it("renders consent text as plain text, not an editable Field", () => {
    render(<SubscribeForm sectionName="home.subscribe" />);

    const consent = screen.getByText(CONSENT_RE);
    expect(consent.dataset.testid).toBeUndefined();
  });

  it("shows validation error for invalid email and does not call mutation", async () => {
    render(<SubscribeForm sectionName="home.subscribe" />);

    const { input, form } = getForm();

    fireEvent.change(input, { target: { value: "not-an-email" } });
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeDefined();
    });
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it("calls subscribe mutation with email, locale, and consentTimestamp", async () => {
    mockMutate.mockResolvedValue({ status: "pending" });
    const now = Date.now();
    vi.spyOn(Date, "now").mockReturnValue(now);

    render(<SubscribeForm sectionName="home.subscribe" />);

    const { input, form } = getForm();
    fireEvent.change(input, { target: { value: "test@example.com" } });
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith({
        email: "test@example.com",
        locale: "en",
        consentTimestamp: now,
      });
    });

    vi.restoreAllMocks();
  });

  it("shows submitting state while mutation is in-flight", async () => {
    mockMutate.mockReturnValue(
      new Promise(() => {
        /* intentionally never resolves */
      })
    );

    render(<SubscribeForm sectionName="home.subscribe" />);

    const { input, form } = getForm();
    fireEvent.change(input, { target: { value: "test@example.com" } });
    fireEvent.submit(form);

    await waitFor(() => {
      const button = screen.getByRole("button");
      expect(button.textContent).toBe("t:submitting");
      expect(button).toHaveProperty("disabled", true);
    });
  });

  it("shows success message after mutation resolves, then resets", async () => {
    vi.useFakeTimers();
    mockMutate.mockResolvedValue({ status: "pending" });

    render(<SubscribeForm sectionName="home.subscribe" />);

    const { input, form } = getForm();
    fireEvent.change(input, { target: { value: "test@example.com" } });

    await act(() => {
      fireEvent.submit(form);
    });

    expect(screen.getByText(SUCCESS_RE)).toBeDefined();

    await act(() => {
      vi.advanceTimersByTime(4000);
    });

    expect(screen.queryByText(SUCCESS_RE)).toBeNull();
    expect(screen.getByRole("button", { name: SUBMIT_NAME })).toBeDefined();

    vi.useRealTimers();
  });

  it("passes the current page locale to the mutation", async () => {
    mockLocale = "it";
    mockMutate.mockResolvedValue({ status: "pending" });

    render(<SubscribeForm sectionName="home.subscribe" />);

    const { input, form } = getForm();
    fireEvent.change(input, { target: { value: "test@example.com" } });
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith(
        expect.objectContaining({ locale: "it" })
      );
    });
  });
});
