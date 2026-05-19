// @vitest-environment jsdom

import { act, cleanup, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("convex/react", () => ({
  useQuery: () => undefined,
}));

import {
  getPageSections,
  PageBoundary,
  usePageBoundaryRegistration,
  usePageRegistry,
} from "./page-boundary";
import { Section } from "./section";

afterEach(cleanup);

function RegisteringChild({ name, label }: { name: string; label: string }) {
  usePageBoundaryRegistration(name, label);
  return <div />;
}

describe("PageBoundary", () => {
  it("registers a child and exposes it via getPageSections", () => {
    render(
      <PageBoundary page="home">
        <RegisteringChild label="Hero Section" name="hero" />
      </PageBoundary>
    );

    const sections = getPageSections("home");
    expect(sections.get("hero")).toBe("Hero Section");
  });

  it("deregisters a child on unmount", () => {
    const { unmount } = render(
      <PageBoundary page="home">
        <RegisteringChild label="Hero Section" name="hero" />
      </PageBoundary>
    );

    expect(getPageSections("home").get("hero")).toBe("Hero Section");
    unmount();
    expect(getPageSections("home").has("hero")).toBe(false);
  });

  it("registers multiple sections with the same boundary", () => {
    render(
      <PageBoundary page="home">
        <RegisteringChild label="Hero" name="hero" />
        <RegisteringChild label="Introduction" name="intro" />
        <RegisteringChild label="Featured Work" name="featured" />
      </PageBoundary>
    );

    const sections = getPageSections("home");
    expect(sections.size).toBe(3);
    expect(sections.get("hero")).toBe("Hero");
    expect(sections.get("intro")).toBe("Introduction");
    expect(sections.get("featured")).toBe("Featured Work");
  });

  it("registers with the nearest ancestor boundary, not a distant one", () => {
    render(
      <PageBoundary page="outer">
        <RegisteringChild label="Outer" name="outer-section" />
        <PageBoundary page="inner">
          <RegisteringChild label="Inner" name="inner-section" />
        </PageBoundary>
      </PageBoundary>
    );

    const outerSections = getPageSections("outer");
    const innerSections = getPageSections("inner");

    expect(outerSections.size).toBe(1);
    expect(outerSections.get("outer-section")).toBe("Outer");
    expect(outerSections.has("inner-section")).toBe(false);

    expect(innerSections.size).toBe(1);
    expect(innerSections.get("inner-section")).toBe("Inner");
  });

  it("usePageRegistry re-renders when sections change", () => {
    function RegistryConsumer({ page }: { page: string }) {
      const sections = usePageRegistry(page);
      return <span data-testid="count">{sections.size}</span>;
    }

    function Togglable() {
      const [show, setShow] = React.useState(false);
      return (
        <PageBoundary page="dynamic">
          <RegistryConsumer page="dynamic" />
          {show && <RegisteringChild label="Late Section" name="late" />}
          <button
            data-testid="toggle"
            onClick={() => setShow(true)}
            type="button"
          />
        </PageBoundary>
      );
    }

    render(<Togglable />);
    expect(screen.getByTestId("count").textContent).toBe("0");

    act(() => {
      screen.getByTestId("toggle").click();
    });

    expect(screen.getByTestId("count").textContent).toBe("1");
  });

  it("Section component registers with nearest PageBoundary", () => {
    render(
      <PageBoundary page="home">
        <Section label="Hero Section" name="hero">
          <div />
        </Section>
        <Section label="Introduction" name="intro">
          <div />
        </Section>
      </PageBoundary>
    );

    const sections = getPageSections("home");
    expect(sections.get("hero")).toBe("Hero Section");
    expect(sections.get("intro")).toBe("Introduction");
  });

  it("Section uses name as label fallback when no label provided", () => {
    render(
      <PageBoundary page="home">
        <Section name="hero">
          <div />
        </Section>
      </PageBoundary>
    );

    const sections = getPageSections("home");
    expect(sections.get("hero")).toBe("hero");
  });
});
