import { describe, expect, it } from "vitest";
import { getLocaleRecommendation } from "./locale-detection";

describe("getLocaleRecommendation", () => {
  it("suggests Italian when browser is Italian and page is English", () => {
    const result = getLocaleRecommendation("en", ["it-IT", "it"]);
    expect(result).toEqual({ suggestedLocale: "it" });
  });

  it("suggests English when browser is English and page is Italian", () => {
    const result = getLocaleRecommendation("it", ["en-US", "en"]);
    expect(result).toEqual({ suggestedLocale: "en" });
  });

  it("falls back to English when browser locale is unsupported and page is not English", () => {
    const result = getLocaleRecommendation("it", ["de-DE", "de"]);
    expect(result).toEqual({ suggestedLocale: "en" });
  });

  it("returns null when browser locale is unsupported and page is already English", () => {
    const result = getLocaleRecommendation("en", ["de-DE", "de"]);
    expect(result).toBeNull();
  });

  it("returns null when page locale matches browser locale", () => {
    const result = getLocaleRecommendation("it", ["it-IT", "it"]);
    expect(result).toBeNull();
  });
});
