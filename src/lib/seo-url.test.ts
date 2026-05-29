import { describe, expect, it } from "vitest";
import { canonicalUrl, languageAlternates, siteOrigin } from "./seo-url";

describe("SEO URLs", () => {
  it("keeps the default locale on the apex path", () => {
    expect(canonicalUrl("en", "/vision")).toBe(
      "https://ginevrarenier.com/vision"
    );
  });

  it("prefixes non-default locales", () => {
    expect(canonicalUrl("it", "/vision")).toBe(
      "https://ginevrarenier.com/it/vision"
    );
  });

  it("emits x-default hreflang for Google locale consolidation", () => {
    expect(languageAlternates("/connect")).toEqual({
      en: `${siteOrigin}/connect`,
      it: `${siteOrigin}/it/connect`,
      "x-default": `${siteOrigin}/connect`,
    });
  });
});
