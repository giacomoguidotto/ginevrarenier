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

    // Immediately after overlay mounts, no overlay rects should be drawn
    // (entrance animations haven't completed yet)
    const rectsImmediate = await overlay.locator("rect[stroke]").count();
    expect(rectsImmediate).toBe(0);

    // Wait for entrance animations to complete (~1.8s for hero CTA delay + duration)
    // Then wait for Chrome spring animations
    await page.waitForTimeout(3000);

    // Now Chrome should have drawn overlays for the hero fields
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

    // Wait for animations + Chrome overlays to appear
    await page.waitForTimeout(3000);
    const rectsBefore = await overlay.locator("rect[stroke]").count();
    expect(rectsBefore).toBeGreaterThan(0);

    // Navigate to a different page
    await page.click('a[href*="/vision"]');
    await page.waitForURL("**/vision");

    // Chrome overlays should be dismounted
    const rectsAfterNav = await overlay.locator("rect[stroke]").count();
    expect(rectsAfterNav).toBe(0);
  });
});
