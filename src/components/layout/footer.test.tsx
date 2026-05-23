// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("framer-motion", () => {
  return {
    motion: new Proxy(
      {},
      {
        get: (_target, prop) => {
          return ({
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
                key === "rel" ||
                key === "target"
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
          };
        },
      }
    ),
  };
});

let mockSocials: Record<string, unknown>[] = [];

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/lib/hooks", () => ({
  useSocialLinks: () => ({ links: mockSocials, isLoading: false }),
}));

vi.mock("@/components/admin/field", () => ({
  Field: ({ name }: { name: string }) => (
    <span data-testid={`field-${name}`}>{name}</span>
  ),
}));

vi.mock("@/components/admin/section", () => ({
  Section: ({ children }: { children?: ReactNode }) => <>{children}</>,
}));

vi.mock("@/i18n/routing", () => ({
  Link: ({ children, href }: { children?: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("@/lib/platform-registry", () => ({
  getHref: (p: string, h: string) => `https://${p}/${h}`,
  getIcon: () => {
    const React = require("react");
    return (props: Record<string, unknown>) =>
      React.createElement("svg", props);
  },
  getLabel: (p: string) => p,
}));

vi.mock("./experience-toggle", () => ({
  ExperienceToggle: () => <span data-testid="experience-toggle" />,
}));

vi.mock("./language-switcher", () => ({
  LanguageSwitcher: () => <span data-testid="language-switcher" />,
}));

import { Footer } from "./footer";

afterEach(cleanup);
beforeEach(() => {
  mockSocials = [];
});

describe("Footer Connect column hiding", () => {
  it("hides the Connect column when no social links", () => {
    render(<Footer />);
    expect(screen.queryByTestId("footer-connect")).toBeNull();
  });

  it("shows the Connect column when social links exist", () => {
    mockSocials = [
      { _id: "1", platform: "instagram", handle: "test", order: 0 },
    ];
    render(<Footer />);
    expect(screen.getByTestId("footer-connect")).toBeDefined();
  });
});
