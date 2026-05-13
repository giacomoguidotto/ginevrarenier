import { expect, test } from "@playwright/test";

const nonEmptyTitle = /.+/;

test("homepage loads", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(nonEmptyTitle);
});
