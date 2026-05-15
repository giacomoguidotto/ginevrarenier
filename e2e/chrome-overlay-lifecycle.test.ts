import { expect, test } from "@playwright/test";

test.describe("Chrome + animation lifecycle", () => {
  test("Chrome overlays appear only after entrance animations complete in edit mode", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      localStorage.setItem("edit-mode-active", "true");
    });

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const overlay = page.locator("[data-chrome-overlay]");
    await expect(overlay).toBeAttached({ timeout: 10_000 });

    await expect(overlay.locator("rect[stroke]").first()).toBeAttached({
      timeout: 15_000,
    });

    const rectsAfterAnimation = await overlay.locator("rect[stroke]").count();
    expect(rectsAfterAnimation).toBeGreaterThan(0);
  });

  test("Chrome overlays disappear on navigation", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("edit-mode-active", "true");
    });

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const overlay = page.locator("[data-chrome-overlay]");
    await expect(overlay).toBeAttached({ timeout: 10_000 });

    await expect(overlay.locator("rect[stroke]").first()).toBeAttached({
      timeout: 15_000,
    });
    const rectsBefore = await overlay.locator("rect[stroke]").count();
    expect(rectsBefore).toBeGreaterThan(0);

    await page.click('a[href*="/vision"]');
    await page.waitForURL("**/vision");

    await expect(overlay.locator("rect[stroke]")).toHaveCount(0, {
      timeout: 5000,
    });
  });
});
