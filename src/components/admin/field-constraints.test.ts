import { describe, expect, it } from "vitest";
import {
  exceedsThreshold,
  isNewlineInput,
  shouldPreventInput,
} from "./field-constraints";

describe("Field constraints", () => {
  describe("isNewlineInput", () => {
    it("identifies insertParagraph as newline", () => {
      expect(isNewlineInput("insertParagraph")).toBe(true);
    });

    it("identifies insertLineBreak as newline", () => {
      expect(isNewlineInput("insertLineBreak")).toBe(true);
    });

    it("does not flag regular text input", () => {
      expect(isNewlineInput("insertText")).toBe(false);
    });

    it("does not flag deletion", () => {
      expect(isNewlineInput("deleteContentBackward")).toBe(false);
    });
  });

  describe("shouldPreventInput", () => {
    it("prevents newline in single-line field", () => {
      expect(shouldPreventInput("insertParagraph", { multiline: false })).toBe(
        true
      );
    });

    it("allows newline in multiline field", () => {
      expect(shouldPreventInput("insertParagraph", { multiline: true })).toBe(
        false
      );
    });

    it("allows regular text in single-line field", () => {
      expect(shouldPreventInput("insertText", { multiline: false })).toBe(
        false
      );
    });
  });

  describe("exceedsThreshold", () => {
    it("returns true when scrollHeight exceeds maxHeight", () => {
      expect(
        exceedsThreshold(
          { scrollHeight: 120, scrollWidth: 200 },
          { maxHeight: 100 }
        )
      ).toBe(true);
    });

    it("returns false when scrollHeight is within maxHeight", () => {
      expect(
        exceedsThreshold(
          { scrollHeight: 80, scrollWidth: 200 },
          { maxHeight: 100 }
        )
      ).toBe(false);
    });

    it("returns true when scrollWidth exceeds maxWidth", () => {
      expect(
        exceedsThreshold(
          { scrollHeight: 50, scrollWidth: 300 },
          { maxWidth: 250 }
        )
      ).toBe(true);
    });

    it("returns false when scrollWidth is within maxWidth", () => {
      expect(
        exceedsThreshold(
          { scrollHeight: 50, scrollWidth: 200 },
          { maxWidth: 250 }
        )
      ).toBe(false);
    });

    it("returns false when no thresholds are set", () => {
      expect(
        exceedsThreshold({ scrollHeight: 9999, scrollWidth: 9999 }, {})
      ).toBe(false);
    });

    it("returns true when both thresholds are exceeded", () => {
      expect(
        exceedsThreshold(
          { scrollHeight: 200, scrollWidth: 400 },
          { maxHeight: 100, maxWidth: 300 }
        )
      ).toBe(true);
    });

    it("returns true at exact boundary (equal to threshold)", () => {
      expect(
        exceedsThreshold(
          { scrollHeight: 100, scrollWidth: 200 },
          { maxHeight: 100 }
        )
      ).toBe(false);
    });
  });
});
