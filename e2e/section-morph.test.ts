import { expect, type Page, test } from "@playwright/test";

function editToolbar(page: Page) {
  return page.locator('[data-testid="edit-toolbar"]');
}

async function enterEditMode(page: Page, url: string) {
  await page.addInitScript(() => {
    localStorage.setItem("edit-mode-active", "true");
  });
  await page.goto(url);
  await expect(page.locator("main")).toBeAttached({ timeout: 15_000 });
  await expect(editToolbar(page)).toBeVisible({ timeout: 15_000 });
}

async function waitForApp(page: Page) {
  await expect(page.locator("main")).toBeAttached({ timeout: 15_000 });
}

function gridToggle(page: Page) {
  return page.locator('[data-testid="grid-mode-toggle"]');
}

function curationGrid(page: Page) {
  return page.locator('[data-testid="curation-grid"]');
}

// ─────────────────────────────────────────────────────────
// Section Morph: carousel ↔ curation grid (#130)
// ─────────────────────────────────────────────────────────

test.describe("Section Morph: grid toggle visibility", () => {
  test("Grid toggle button appears in edit mode", async ({ page }) => {
    await enterEditMode(page, "/");
    await expect(gridToggle(page)).toBeVisible({ timeout: 15_000 });
  });

  test("Grid toggle button is hidden outside edit mode", async ({ page }) => {
    await page.goto("/");
    await waitForApp(page);
    await expect(gridToggle(page)).toHaveCount(0);
  });
});

function carousel(page: Page) {
  return page.locator('[data-testid="selected-works-carousel"]');
}

function scrollArrows(page: Page) {
  return page.locator(
    'button[aria-label="Previous project"], button[aria-label="Next project"]'
  );
}

test.describe("Section Morph: carousel → grid", () => {
  test("Clicking toggle shows curation grid with all projects", async ({
    page,
  }) => {
    await enterEditMode(page, "/");
    await expect(gridToggle(page)).toBeVisible({ timeout: 15_000 });

    await gridToggle(page).click();

    await expect(curationGrid(page)).toBeVisible({ timeout: 10_000 });
    const cards = curationGrid(page).locator('[data-testid="curation-card"]');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
  });

  test("Carousel is hidden when grid is open", async ({ page }) => {
    await enterEditMode(page, "/");
    await gridToggle(page).click();
    await expect(curationGrid(page)).toBeVisible({ timeout: 10_000 });

    await expect(carousel(page)).toHaveCount(0);
  });
});

test.describe("Section Morph: grid → carousel", () => {
  test("Clicking X closes grid and restores carousel", async ({ page }) => {
    await enterEditMode(page, "/");
    await expect(gridToggle(page)).toBeVisible({ timeout: 15_000 });

    await gridToggle(page).click();
    await expect(curationGrid(page)).toBeVisible({ timeout: 10_000 });

    await gridToggle(page).click();
    await expect(carousel(page)).toBeVisible({ timeout: 10_000 });
    await expect(curationGrid(page)).toHaveCount(0);
  });

  test("Scroll arrows reappear after closing grid", async ({ page }) => {
    await enterEditMode(page, "/");
    await gridToggle(page).click();
    await expect(curationGrid(page)).toBeVisible({ timeout: 10_000 });
    await expect(scrollArrows(page)).toHaveCount(0);

    await gridToggle(page).click();
    await expect(carousel(page)).toBeVisible({ timeout: 10_000 });
    await expect(scrollArrows(page).first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Section Morph: visual distinction", () => {
  test("Selected cards have full opacity, unselected are desaturated", async ({
    page,
  }) => {
    await enterEditMode(page, "/");
    await gridToggle(page).click();
    await expect(curationGrid(page)).toBeVisible({ timeout: 10_000 });

    const selectedCard = curationGrid(page)
      .locator('[data-testid="curation-card"][data-selected="true"]')
      .first();
    const unselectedCard = curationGrid(page)
      .locator('[data-testid="curation-card"][data-selected="false"]')
      .first();

    if (
      (await selectedCard.count()) > 0 &&
      (await unselectedCard.count()) > 0
    ) {
      const selectedClasses = await selectedCard.getAttribute("class");
      const unselectedClasses = await unselectedCard.getAttribute("class");
      expect(selectedClasses).not.toContain("grayscale");
      expect(unselectedClasses).toContain("grayscale");
    }
  });

  test("Selected cards show star indicator, unselected do not", async ({
    page,
  }) => {
    await enterEditMode(page, "/");
    await gridToggle(page).click();
    await expect(curationGrid(page)).toBeVisible({ timeout: 10_000 });

    const selectedCard = curationGrid(page)
      .locator('[data-testid="curation-card"][data-selected="true"]')
      .first();
    if ((await selectedCard.count()) > 0) {
      await expect(
        selectedCard.locator('[data-testid="selection-star"]')
      ).toBeVisible();
    }

    const unselectedCard = curationGrid(page)
      .locator('[data-testid="curation-card"][data-selected="false"]')
      .first();
    if ((await unselectedCard.count()) > 0) {
      await expect(
        unselectedCard.locator('[data-testid="selection-star"]')
      ).toHaveCount(0);
    }
  });
});

test.describe("Section Morph: drag-to-reorder", () => {
  test("Drag handles are visible on card hover", async ({ page }) => {
    await enterEditMode(page, "/");
    await gridToggle(page).click();
    await expect(curationGrid(page)).toBeVisible({ timeout: 10_000 });

    const firstCard = curationGrid(page)
      .locator('[data-testid="curation-card"]')
      .first();
    await expect(firstCard).toBeVisible();

    const handle = firstCard.locator('[data-testid="drag-handle"]');
    await firstCard.hover();
    await expect(handle).toBeVisible({ timeout: 5000 });
  });

  test("Grid container has sortable context attributes", async ({ page }) => {
    await enterEditMode(page, "/");
    await gridToggle(page).click();
    await expect(curationGrid(page)).toBeVisible({ timeout: 10_000 });

    const firstCard = curationGrid(page)
      .locator('[data-testid="curation-card"]')
      .first();
    const role = await firstCard.getAttribute("role");
    expect(role).toBe("button");
  });
});

test.describe("Section Morph: selection toggle", () => {
  test("Tapping a card toggles its selection state", async ({ page }) => {
    await enterEditMode(page, "/");
    await gridToggle(page).click();
    await expect(curationGrid(page)).toBeVisible({ timeout: 10_000 });

    const firstCard = curationGrid(page)
      .locator('[data-testid="curation-card"]')
      .first();
    await expect(firstCard).toBeVisible();

    const wasSelected = await firstCard.getAttribute("data-selected");

    await firstCard.click();

    const isSelected = await firstCard.getAttribute("data-selected");
    expect(isSelected).not.toBe(wasSelected);
  });

  test("Toggling selection shows star indicator on selected card", async ({
    page,
  }) => {
    await enterEditMode(page, "/");
    await gridToggle(page).click();
    await expect(curationGrid(page)).toBeVisible({ timeout: 10_000 });

    const cards = curationGrid(page).locator('[data-testid="curation-card"]');
    const unselectedCard = cards.locator('[data-selected="false"]').first();

    if ((await unselectedCard.count()) > 0) {
      await expect(
        unselectedCard.locator('[data-testid="selection-star"]')
      ).toHaveCount(0);

      await unselectedCard.click();

      await expect(
        unselectedCard.locator('[data-testid="selection-star"]')
      ).toBeVisible({ timeout: 5000 });
    }
  });
});
