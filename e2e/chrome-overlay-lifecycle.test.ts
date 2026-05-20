import { expect, type Page, test } from "@playwright/test";

async function enterEditMode(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem("edit-mode-active", "true");
  });
}

async function waitForApp(page: Page) {
  await page.locator("main").waitFor();
}

function fieldChromes(page: Page) {
  return page.locator("[data-field-chrome]");
}

function chromeRects(page: Page) {
  return page.locator("[data-field-chrome] rect[stroke]");
}

test.describe("Per-field Chrome lifecycle", () => {
  test("Chrome outlines appear after entrance animations complete on page load in edit mode", async ({
    page,
  }) => {
    await enterEditMode(page);
    await page.goto("/");
    await waitForApp(page);

    await expect(fieldChromes(page).first()).toBeAttached({ timeout: 10_000 });
    await expect(chromeRects(page).first()).toBeAttached({ timeout: 15_000 });

    const rectCount = await chromeRects(page).count();
    expect(rectCount).toBeGreaterThan(0);
  });

  test("Chrome outlines appear on dynamically added entities", async ({
    page,
  }) => {
    await enterEditMode(page);
    await page.goto("/en/essence");
    await waitForApp(page);

    await expect(chromeRects(page).first()).toBeAttached({ timeout: 15_000 });
    const chromeCountBefore = await fieldChromes(page).count();

    const addButton = page.getByRole("button", { name: "Add Timeline Entry" });
    await addButton.scrollIntoViewIfNeeded();
    await addButton.click();

    await page.waitForFunction(
      (prevCount: number) =>
        document.querySelectorAll("[data-field-chrome]").length > prevCount,
      chromeCountBefore,
      { timeout: 10_000 }
    );

    const chromeCountAfter = await fieldChromes(page).count();
    expect(chromeCountAfter).toBeGreaterThan(chromeCountBefore);
  });

  test("Chrome is a DOM child of each Field, not a global overlay", async ({
    page,
  }) => {
    await enterEditMode(page);
    await page.goto("/");
    await waitForApp(page);

    await expect(chromeRects(page).first()).toBeAttached({ timeout: 15_000 });

    const chromeCount = await fieldChromes(page).count();
    expect(chromeCount).toBeGreaterThan(0);

    const allContained = await page.evaluate(() => {
      const chromes = document.querySelectorAll("[data-field-chrome]");
      return Array.from(chromes).every((svg) => {
        const parent = svg.parentElement;
        return parent?.style.position === "relative";
      });
    });
    expect(allContained).toBe(true);

    const fieldCount = await page.locator(".editable-field").count();
    expect(chromeCount).toBeLessThanOrEqual(fieldCount);
  });

  test("Chrome outlines disappear when navigating to a new page", async ({
    page,
  }) => {
    await enterEditMode(page);
    await page.goto("/en");
    await waitForApp(page);

    await expect(chromeRects(page).first()).toBeAttached({ timeout: 15_000 });
    const rectsBefore = await chromeRects(page).count();
    expect(rectsBefore).toBeGreaterThan(0);

    await page.click('a[href*="/vision"]');
    await page.waitForURL("**/vision");
    await waitForApp(page);

    await expect(fieldChromes(page).first()).toBeAttached({ timeout: 10_000 });
  });

  test("Chrome outlines exit-animate when toggling edit mode off", async ({
    page,
  }) => {
    await enterEditMode(page);
    await page.goto("/en");
    await waitForApp(page);

    await expect(chromeRects(page).first()).toBeAttached({ timeout: 15_000 });
    const rectsBefore = await chromeRects(page).count();
    expect(rectsBefore).toBeGreaterThan(0);

    const exitButton = page
      .locator('[data-testid="edit-toolbar"]')
      .locator('button[aria-label="Exit edit mode"]');
    await exitButton.click();

    await expect(fieldChromes(page)).toHaveCount(0, { timeout: 5000 });
  });
});
