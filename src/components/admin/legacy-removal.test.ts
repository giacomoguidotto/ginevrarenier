import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = resolve(import.meta.dirname, "../../..");
const SOURCE_FILE_PATTERN = /\.(tsx?|jsx?)$/;

function findTsxFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = resolve(dir, entry);
    if (entry === "node_modules" || entry === ".next") {
      continue;
    }
    if (statSync(full).isDirectory()) {
      results.push(...findTsxFiles(full));
    } else if (SOURCE_FILE_PATTERN.test(entry) && !entry.includes(".test.")) {
      results.push(full);
    }
  }
  return results;
}

describe("Legacy files are deleted", () => {
  const legacyFiles = [
    "src/components/admin/editable-text.tsx",
    "src/components/admin/page-changes-context.tsx",
    "src/components/admin/edit-mode-lines.tsx",
    "src/components/admin/use-section-lines.ts",
    "src/lib/use-editable-content.ts",
  ];

  for (const file of legacyFiles) {
    it(`${file} does not exist`, () => {
      expect(existsSync(resolve(ROOT, file))).toBe(false);
    });
  }
});

describe("No page component imports legacy modules", () => {
  const pageFiles = findTsxFiles(resolve(ROOT, "src")).filter(
    (f) =>
      !f.includes("/admin/") ||
      f.includes("edit-toolbar-wrapper") ||
      f.includes("unsaved-changes-guard")
  );

  const forbiddenImports = [
    "EditableText",
    "usePageChanges",
    "useEditableSiteContent",
    "useSectionLines",
    "EditModeLines",
    "PageChangesProvider",
  ];

  for (const symbol of forbiddenImports) {
    it(`no source file imports ${symbol}`, () => {
      const offenders: string[] = [];
      for (const file of pageFiles) {
        const content = readFileSync(file, "utf-8");
        if (content.includes(symbol)) {
          offenders.push(file.replace(`${ROOT}/`, ""));
        }
      }
      expect(offenders).toEqual([]);
    });
  }
});
