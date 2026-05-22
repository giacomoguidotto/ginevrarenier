// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Section, useSection } from "./section";

vi.mock("convex/react", () => ({
  useQuery: (
    _ref: unknown,
    args: { section?: string; id?: string } | "skip"
  ) => {
    if (args === "skip") {
      return;
    }
    if ("section" in args && args.section === "hero") {
      return { content: { title: { en: "Hero Title", it: "Titolo Hero" } } };
    }
    if ("id" in args && args.id === "project-id-1") {
      return {
        _id: "project-id-1",
        title: { en: "Solstice", it: "Solstizio" },
        subtitle: { en: "Sub EN", it: "Sub IT" },
        description: { en: "Desc EN", it: "Desc IT" },
        tagline: { en: "Tag EN", it: "Tag IT" },
        slug: "solstice",
        published: false,
      };
    }
    if ("id" in args && args.id === "post-id-1") {
      return {
        _id: "post-id-1",
        title: { en: "My Post", it: "Mio Post" },
        excerpt: { en: "Exc EN", it: "Exc IT" },
        slug: "my-post",
        published: false,
      };
    }
    if ("id" in args && args.id === "achievement-id-1") {
      return {
        _id: "achievement-id-1",
        startYear: 2022,
        title: { en: "First Camera", it: "Prima Fotocamera" },
        description: { en: "Inherited", it: "Ereditato" },
      };
    }
    if ("id" in args && args.id === "achievement-id-2") {
      return {
        _id: "achievement-id-2",
        startYear: 2018,
        endYear: 2020,
        title: { en: "Studies", it: "Studi" },
        description: { en: "Academy", it: "Accademia" },
      };
    }
    return;
  },
}));

afterEach(cleanup);

function SectionConsumer() {
  const { name, data, label } = useSection();
  return (
    <div>
      <span data-testid="section-name">{name}</span>
      <span data-testid="section-label">{label ?? ""}</span>
      <span data-testid="section-data">{JSON.stringify(data)}</span>
    </div>
  );
}

describe("Section with real sections", () => {
  it("provides section data from siteContent query", () => {
    render(
      <Section name="hero">
        <SectionConsumer />
      </Section>
    );

    expect(screen.getByTestId("section-name").textContent).toBe("hero");
    expect(
      JSON.parse(screen.getByTestId("section-data").textContent ?? "")
    ).toEqual({ title: { en: "Hero Title", it: "Titolo Hero" } });
  });
});

describe("Section with virtual sections", () => {
  it("provides project entity data mapped to section data shape", () => {
    render(
      <Section label="Project: Solstice" name="project:project-id-1">
        <SectionConsumer />
      </Section>
    );

    expect(screen.getByTestId("section-name").textContent).toBe(
      "project:project-id-1"
    );
    const data = JSON.parse(
      screen.getByTestId("section-data").textContent ?? ""
    );
    expect(data.title).toEqual({ en: "Solstice", it: "Solstizio" });
    expect(data.subtitle).toEqual({ en: "Sub EN", it: "Sub IT" });
    expect(data.description).toEqual({ en: "Desc EN", it: "Desc IT" });
    expect(data.tagline).toEqual({ en: "Tag EN", it: "Tag IT" });
  });

  it("provides post entity data mapped to section data shape", () => {
    render(
      <Section label="Post: My Post" name="post:post-id-1">
        <SectionConsumer />
      </Section>
    );

    expect(screen.getByTestId("section-name").textContent).toBe(
      "post:post-id-1"
    );
    const data = JSON.parse(
      screen.getByTestId("section-data").textContent ?? ""
    );
    expect(data.title).toEqual({ en: "My Post", it: "Mio Post" });
    expect(data.excerpt).toEqual({ en: "Exc EN", it: "Exc IT" });
  });

  it("provides achievement entity data with year as localized text", () => {
    render(
      <Section label="Achievement: 2022" name="achievement:achievement-id-1">
        <SectionConsumer />
      </Section>
    );

    const data = JSON.parse(
      screen.getByTestId("section-data").textContent ?? ""
    );
    expect(data.startYear).toEqual({ en: "2022", it: "2022" });
    expect(data.title).toEqual({
      en: "First Camera",
      it: "Prima Fotocamera",
    });
    expect(data.description).toEqual({ en: "Inherited", it: "Ereditato" });
    expect(data.endYear).toBeUndefined();
  });

  it("includes endYear when achievement has a date range", () => {
    render(
      <Section
        label="Achievement: 2018 — 2020"
        name="achievement:achievement-id-2"
      >
        <SectionConsumer />
      </Section>
    );

    const data = JSON.parse(
      screen.getByTestId("section-data").textContent ?? ""
    );
    expect(data.startYear).toEqual({ en: "2018", it: "2018" });
    expect(data.endYear).toEqual({ en: "2020", it: "2020" });
  });

  it("exposes label via context", () => {
    render(
      <Section label="Project: Solstice" name="project:project-id-1">
        <SectionConsumer />
      </Section>
    );

    expect(screen.getByTestId("section-label").textContent).toBe(
      "Project: Solstice"
    );
  });
});
