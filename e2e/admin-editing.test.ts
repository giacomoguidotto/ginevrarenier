import { expect, type Page, test } from "@playwright/test";

const LOCALE_PATTERN = /EN.*IT|IT.*EN/;
const STALE_FIELD_WARNING = /undismissed stale field/;

function editableFields(page: Page) {
  return page.locator(".editable-field");
}

function fieldChromes(page: Page) {
  return page.locator("[data-field-chrome]");
}

function chromeRects(page: Page) {
  return page.locator("[data-field-chrome] rect[stroke]");
}

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
  await expect(editableFields(page).first()).toBeAttached({ timeout: 15_000 });
}

async function waitForApp(page: Page) {
  await expect(page.locator("main")).toBeAttached({ timeout: 15_000 });
}

async function waitForChromeRects(page: Page) {
  await expect(chromeRects(page).first()).toBeAttached({ timeout: 15_000 });
}

// ─────────────────────────────────────────────────────────
// US-1: Click any text and start typing immediately (WYSIWYG, no visual jump)
// ─────────────────────────────────────────────────────────
test.describe("US-1: Inline contentEditable editing", () => {
  test("Fields become contentEditable in edit mode", async ({ page }) => {
    await enterEditMode(page, "/");

    const fields = editableFields(page);
    const count = await fields.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < Math.min(count, 3); i++) {
      const attr = await fields.nth(i).getAttribute("contenteditable");
      expect(attr).toBe("plaintext-only");
    }
  });

  test("Fields are NOT contentEditable outside edit mode", async ({ page }) => {
    await page.goto("/");
    await waitForApp(page);

    const field = page.locator(".hero-title");
    await expect(field).toBeAttached({ timeout: 15_000 });
    const attr = await field.getAttribute("contenteditable");
    expect(attr).toBeNull();
  });

  test("Typing in a Field updates the DOM text immediately", async ({
    page,
  }) => {
    await enterEditMode(page, "/");

    const field = editableFields(page).first();
    await expect(field).toBeVisible({ timeout: 10_000 });

    const originalText = await field.textContent();
    await field.click();
    await page.keyboard.type("TEST");

    const updatedText = await field.textContent();
    expect(updatedText).toContain("TEST");
    expect(updatedText).not.toBe(originalText);
  });

  test("Same DOM element is used for display and editing (no element swap)", async ({
    page,
  }) => {
    await enterEditMode(page, "/");

    const heroTitle = page.locator(".hero-title");
    await expect(heroTitle).toBeAttached({ timeout: 15_000 });

    const inner = heroTitle.locator(".editable-field");
    await expect(inner).toBeAttached();

    const tagName = await inner.evaluate((el) => el.tagName.toLowerCase());
    expect(tagName).toBe("span");

    const isEditable = await inner.getAttribute("contenteditable");
    expect(isEditable).toBe("plaintext-only");
  });
});

// ─────────────────────────────────────────────────────────
// US-2: Chrome overlay with animated outlines on entering edit mode
// ─────────────────────────────────────────────────────────
test.describe("US-2: Chrome overlay appears in edit mode", () => {
  test("Per-field Chrome SVGs are present in the DOM", async ({ page }) => {
    await enterEditMode(page, "/");

    await expect(fieldChromes(page).first()).toBeAttached({ timeout: 10_000 });
  });

  test("Chrome outlines appear after entrance animations", async ({ page }) => {
    await enterEditMode(page, "/");
    await waitForChromeRects(page);

    const afterRects = await chromeRects(page).count();
    expect(afterRects).toBeGreaterThan(0);
  });

  test("Chrome outlines include hatching pattern", async ({ page }) => {
    await enterEditMode(page, "/");
    await waitForChromeRects(page);

    const hatching = fieldChromes(page).locator(
      "rect[fill^='url(#chrome-hatching']"
    );
    const count = await hatching.count();
    expect(count).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────
// US-3: Exiting edit mode reverses Chrome animations
// ─────────────────────────────────────────────────────────
test.describe("US-3: Chrome overlay disappears on exit", () => {
  test("Chrome rects disappear when edit mode is off", async ({ page }) => {
    await page.goto("/");
    await waitForApp(page);

    const rects = await chromeRects(page).count();
    expect(rects).toBe(0);
  });

  test("No per-field Chrome renders when not in edit mode", async ({
    page,
  }) => {
    await page.goto("/");
    await waitForApp(page);

    const chromeCount = await fieldChromes(page).count();
    expect(chromeCount).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────
// US-4: Chrome outlines track Field geometry changes
// ─────────────────────────────────────────────────────────
test.describe("US-4: Chrome follows resized Fields", () => {
  test("Chrome rects update when Field content changes size", async ({
    page,
  }) => {
    await enterEditMode(page, "/");
    await waitForChromeRects(page);

    const initialRects = await fieldChromes(page)
      .locator("rect[stroke]")
      .evaluateAll((rects) =>
        rects.map((r) => ({
          width: Number(r.getAttribute("width")),
          height: Number(r.getAttribute("height")),
        }))
      );
    expect(initialRects.length).toBeGreaterThan(0);

    const introSection = page.locator('[data-testid="intro-section"]');
    await introSection.scrollIntoViewIfNeeded();
    await expect(introSection.locator(".editable-field").first()).toBeAttached({
      timeout: 15_000,
    });

    const bioField = introSection.locator("p.editable-field").last();
    if ((await bioField.count()) > 0) {
      await expect(bioField).toBeVisible({ timeout: 10_000 });
      await bioField.click();
      await page.keyboard.type("\nNew line of text added for testing");
      await expect(chromeRects(page).first()).toBeAttached({ timeout: 5000 });

      const updatedRects = await fieldChromes(page)
        .locator("rect[stroke]")
        .evaluateAll((rects) =>
          rects.map((r) => ({
            width: Number(r.getAttribute("width")),
            height: Number(r.getAttribute("height")),
          }))
        );
      expect(updatedRects.length).toBeGreaterThan(0);
    }
  });
});

// ─────────────────────────────────────────────────────────
// US-5: Fields stop input at threshold
// ─────────────────────────────────────────────────────────
test.describe("US-5: Field threshold enforcement", () => {
  test("Non-multiline fields block Enter key", async ({ page }) => {
    await enterEditMode(page, "/");

    const tagline = page
      .locator("section")
      .first()
      .locator("p.editable-field")
      .first();
    if ((await tagline.count()) > 0) {
      const textBefore = await tagline.textContent();
      await tagline.click();
      await page.keyboard.press("Enter");
      const textAfter = await tagline.textContent();
      expect(textAfter).toBe(textBefore);
    }
  });
});

// ─────────────────────────────────────────────────────────
// US-6: Locale switching swaps Field content
// ─────────────────────────────────────────────────────────
test.describe("US-6: Bilingual locale switching", () => {
  test("Toolbar shows locale switcher in edit mode", async ({ page }) => {
    await enterEditMode(page, "/");

    const toolbar = editToolbar(page);
    const enText = toolbar.getByText("EN");
    const itText = toolbar.getByText("IT");
    await expect(enText).toBeVisible();
    await expect(itText).toBeVisible();
  });

  test("Clicking locale switcher changes Field content", async ({ page }) => {
    await enterEditMode(page, "/en");

    const heroTitle = page.locator(".hero-title");
    const enText = await heroTitle.textContent();

    const toolbar = editToolbar(page);
    const localeButton = toolbar
      .locator("button")
      .filter({ hasText: LOCALE_PATTERN });
    await localeButton.click();
    await expect(heroTitle).not.toHaveText(enText ?? "", { timeout: 5000 });

    const itText = await heroTitle.textContent();
    expect(itText).toBeDefined();
  });
});

// ─────────────────────────────────────────────────────────
// US-7: Stale-locale indicators (amber dots)
// ─────────────────────────────────────────────────────────
test.describe("US-7: Stale-locale indicators", () => {
  test("Editing in one locale shows amber dot on Chrome overlay", async ({
    page,
  }) => {
    await enterEditMode(page, "/en");
    await waitForChromeRects(page);

    const field = editableFields(page).first();
    await expect(field).toBeAttached({ timeout: 10_000 });
    await field.click();
    await page.keyboard.type("X");
    await field.blur();

    const amberDots = page.locator(
      '[data-slot="semantic-dot"][data-variant="warning"]'
    );
    await expect(amberDots.first()).toBeAttached({ timeout: 5000 });
  });
});

// ─────────────────────────────────────────────────────────
// Progressive locale staleness: three-tier disclosure
// ─────────────────────────────────────────────────────────
test.describe("Progressive locale staleness", () => {
  function fieldSemanticDots(page: Page) {
    return page.locator("[data-field-chrome] + div [data-slot='semantic-dot']");
  }

  function localeToggleDots(page: Page) {
    return editToolbar(page)
      .locator('button[aria-label="Switch language"]')
      .locator("[data-slot='semantic-dot']");
  }

  function navStaleDots(page: Page) {
    return page.locator("header nav [data-slot='semantic-dot']");
  }

  function localeButton(page: Page) {
    return editToolbar(page)
      .locator("button")
      .filter({ hasText: LOCALE_PATTERN });
  }

  async function editFieldAndBlur(
    page: Page,
    field: ReturnType<typeof editableFields>,
    text: string
  ) {
    await field.click();
    await page.keyboard.type(text);
    await field.blur();
  }

  async function switchLocale(page: Page) {
    await localeButton(page).click();
  }

  test("Editing EN then switching to IT shows amber dots on locale toggle, nav link, and per-field chrome", async ({
    page,
  }) => {
    await enterEditMode(page, "/en");
    await waitForChromeRects(page);

    await editFieldAndBlur(page, editableFields(page).first(), "X");

    await expect(localeToggleDots(page).first()).toBeAttached({
      timeout: 5000,
    });

    await switchLocale(page);

    await expect(navStaleDots(page).first()).toBeAttached({ timeout: 5000 });
    await expect(fieldSemanticDots(page).first()).toBeAttached({
      timeout: 5000,
    });
  });

  test("Editing the stale locale clears all amber dots", async ({ page }) => {
    await enterEditMode(page, "/en");
    await waitForChromeRects(page);

    const field = editableFields(page).first();
    await editFieldAndBlur(page, field, "X");

    await switchLocale(page);

    await editFieldAndBlur(page, field, "Y");

    await expect(localeToggleDots(page)).toHaveCount(0, { timeout: 5000 });
    await expect(navStaleDots(page)).toHaveCount(0, { timeout: 5000 });
    await expect(fieldSemanticDots(page)).toHaveCount(0, { timeout: 5000 });
  });

  test("Dismissing a stale dot hides it, re-editing source restores it", async ({
    page,
  }) => {
    await enterEditMode(page, "/en");
    await waitForChromeRects(page);

    const field = editableFields(page).first();
    await editFieldAndBlur(page, field, "X");

    await switchLocale(page);

    const dots = fieldSemanticDots(page);
    await expect(dots.first()).toBeAttached({ timeout: 5000 });

    await dots.first().click();
    await expect(dots).toHaveCount(0, { timeout: 5000 });

    await switchLocale(page);
    await editFieldAndBlur(page, field, "Z");

    await switchLocale(page);
    await expect(fieldSemanticDots(page).first()).toBeAttached({
      timeout: 5000,
    });
  });

  test("Auto-translate shows info dots, manual edit clears them", async ({
    page,
  }) => {
    await enterEditMode(page, "/en");
    await waitForChromeRects(page);

    const fields = editableFields(page);
    await editFieldAndBlur(page, fields.first(), "A");
    await editFieldAndBlur(page, fields.nth(1), "B");

    await switchLocale(page);

    const translateButton = editToolbar(page).getByText("Translate");
    await expect(translateButton).toBeVisible({ timeout: 5000 });
    await translateButton.click();

    const infoDots = page.locator(
      "[data-slot='semantic-dot'][data-variant='info']"
    );
    await expect(infoDots.first()).toBeAttached({ timeout: 15_000 });

    const dots = fieldSemanticDots(page);
    const countAfterTranslate = await dots.count();
    expect(countAfterTranslate).toBeGreaterThanOrEqual(2);

    await editFieldAndBlur(page, fields.first(), "C");
    await expect(dots).toHaveCount(countAfterTranslate - 1, {
      timeout: 5000,
    });
  });

  test("Save dialog shows stale field warning when undismissed stale fields exist", async ({
    page,
  }) => {
    await enterEditMode(page, "/en");
    await waitForChromeRects(page);

    await editFieldAndBlur(page, editableFields(page).first(), "X");

    const saveButton = editToolbar(page).getByText("Save");
    await expect(saveButton).toBeVisible({ timeout: 5000 });
    await saveButton.click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await expect(dialog.getByText("Save changes")).toBeVisible();
    await expect(dialog.getByText(STALE_FIELD_WARNING)).toBeVisible({
      timeout: 5000,
    });
  });

  test("Creating an entity (structural operation) produces no staleness warnings", async ({
    page,
  }) => {
    await enterEditMode(page, "/en/essence");
    await waitForChromeRects(page);

    const dotsBefore = await fieldSemanticDots(page).count();

    const addButton = page.getByRole("button", { name: "Add Timeline Entry" });
    await addButton.scrollIntoViewIfNeeded();
    await addButton.click();

    const chromesBefore = await fieldChromes(page).count();
    await expect(fieldChromes(page)).not.toHaveCount(chromesBefore, {
      timeout: 10_000,
    });

    expect(await fieldSemanticDots(page).count()).toBe(dotsBefore);
  });
});

// ─────────────────────────────────────────────────────────
// US-8: Save all changes with single Save button
// ─────────────────────────────────────────────────────────
test.describe("US-8: Save button appears with changes", () => {
  test("Save button appears in toolbar when there are unsaved changes", async ({
    page,
  }) => {
    await enterEditMode(page, "/");

    const toolbar = editToolbar(page);

    const saveCountBefore = await toolbar.getByText("Save").count();
    expect(saveCountBefore).toBe(0);

    const field = editableFields(page).first();
    await field.click();
    await page.keyboard.type("Z");
    await field.blur();

    const saveButtonAfter = toolbar.getByText("Save");
    await expect(saveButtonAfter).toBeVisible({ timeout: 5000 });
  });
});

// ─────────────────────────────────────────────────────────
// US-9: Confirmation dialog before saving
// ─────────────────────────────────────────────────────────
test.describe("US-9: Save confirmation dialog", () => {
  test("Clicking Save opens a confirmation dialog listing changes", async ({
    page,
  }) => {
    await enterEditMode(page, "/");

    const field = editableFields(page).first();
    await field.click();
    await page.keyboard.type("Q");
    await field.blur();

    const toolbar = editToolbar(page);
    const saveButton = toolbar.getByText("Save");
    await expect(saveButton).toBeVisible({ timeout: 5000 });
    await saveButton.click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText("Save changes")).toBeVisible();

    const changesList = dialog.locator("ul").first();
    await expect(changesList).toBeAttached();
  });
});

// ─────────────────────────────────────────────────────────
// US-10: Discard all changes
// ─────────────────────────────────────────────────────────
test.describe("US-10: Discard button appears with changes", () => {
  test("Discard button appears when there are changes", async ({ page }) => {
    await enterEditMode(page, "/");

    const field = editableFields(page).first();
    await field.click();
    await page.keyboard.type("W");
    await field.blur();

    const toolbar = editToolbar(page);
    const discardButton = toolbar.getByText("Discard");
    await expect(discardButton).toBeVisible({ timeout: 5000 });
  });
});

// ─────────────────────────────────────────────────────────
// US-11: Confirmation dialog before discarding
// ─────────────────────────────────────────────────────────
test.describe("US-11: Discard confirmation dialog", () => {
  test("Clicking Discard opens a confirmation dialog", async ({ page }) => {
    await enterEditMode(page, "/");

    const field = editableFields(page).first();
    await field.click();
    await page.keyboard.type("R");
    await field.blur();

    const toolbar = editToolbar(page);
    const discardButton = toolbar.getByText("Discard");
    await expect(discardButton).toBeVisible({ timeout: 5000 });
    await discardButton.click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText("Discard changes")).toBeVisible();
  });

  test("Discard dialog warns about changes that will be lost", async ({
    page,
  }) => {
    await enterEditMode(page, "/");

    const field = editableFields(page).first();
    await field.click();
    await page.keyboard.type("S");
    await field.blur();

    const toolbar = editToolbar(page);
    const discardButton = toolbar.getByText("Discard");
    await expect(discardButton).toBeVisible({ timeout: 5000 });
    await discardButton.click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    const description = dialog.locator("text=unsaved");
    await expect(description).toBeAttached();
  });
});

// ─────────────────────────────────────────────────────────
// US-17: Chrome doesn't appear on mid-animation Fields
// ─────────────────────────────────────────────────────────
test.describe("US-17: Chrome waits for entrance animations", () => {
  test("No Chrome in viewer mode, Chrome appears after edit mode activates", async ({
    page,
  }) => {
    await page.goto("/");
    await waitForApp(page);

    await expect(fieldChromes(page)).toHaveCount(0);

    await page.addInitScript(() => {
      localStorage.setItem("edit-mode-active", "true");
    });
    await page.goto("/");

    await expect(fieldChromes(page).first()).toBeAttached({ timeout: 15_000 });
  });
});

// ─────────────────────────────────────────────────────────
// US-18: Navigation instantly dismounts Chrome
// ─────────────────────────────────────────────────────────
test.describe("US-18: Chrome dismount on navigation", () => {
  test("Old Chrome unmounts on navigation, new page gets fresh Chrome", async ({
    page,
  }) => {
    await enterEditMode(page, "/en");
    await waitForChromeRects(page);

    const rectsBefore = await chromeRects(page).count();
    expect(rectsBefore).toBeGreaterThan(0);

    await page.click('a[href*="/vision"]');
    await page.waitForURL("**/vision");
    await waitForApp(page);

    await expect(fieldChromes(page).first()).toBeAttached({ timeout: 10_000 });
  });
});

// ─────────────────────────────────────────────────────────
// US-19: Fields below fold activate on scroll into view
// ─────────────────────────────────────────────────────────
test.describe("US-19: Below-fold Fields activate on scroll", () => {
  test("Intro section Fields get Chrome overlays after scrolling into view", async ({
    page,
  }) => {
    await enterEditMode(page, "/");
    await waitForChromeRects(page);

    const heroRectCount = await chromeRects(page).count();

    const introSection = page.locator('[data-testid="intro-section"]');
    await introSection.scrollIntoViewIfNeeded();
    await page.waitForFunction(
      (prevCount: number) =>
        document.querySelectorAll("[data-field-chrome] rect[stroke]").length >
        prevCount,
      heroRectCount,
      { timeout: 15_000 }
    );

    const afterScrollRectCount = await chromeRects(page).count();
    expect(afterScrollRectCount).toBeGreaterThanOrEqual(heroRectCount);
  });
});

// ─────────────────────────────────────────────────────────
// US-20: Pasting strips all formatting
// ─────────────────────────────────────────────────────────
test.describe("US-20: Paste strips formatting", () => {
  test("contentEditable='plaintext-only' strips rich text on paste", async ({
    page,
    context,
  }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await enterEditMode(page, "/");

    const field = editableFields(page).first();
    await expect(field).toBeAttached();
    await field.click();

    const modifier = process.platform === "darwin" ? "Meta" : "Control";
    await page.keyboard.press(`${modifier}+A`);
    await page.keyboard.press("Backspace");

    await page.evaluate(async () => {
      const items = [
        new ClipboardItem({
          "text/html": new Blob(["<b>bold</b> <i>italic</i>"], {
            type: "text/html",
          }),
          "text/plain": new Blob(["bold italic"], { type: "text/plain" }),
        }),
      ];
      await navigator.clipboard.write(items);
    });
    await field.focus();
    await page.keyboard.press(`${modifier}+V`);
    await expect(field).toContainText("bold italic", { timeout: 5000 });

    const innerHTML = await field.innerHTML();
    expect(innerHTML).not.toContain("<b>");
    expect(innerHTML).not.toContain("<i>");
  });

  test("Field uses plaintext-only contentEditable attribute", async ({
    page,
  }) => {
    await enterEditMode(page, "/");

    const field = editableFields(page).first();
    const attr = await field.getAttribute("contenteditable");
    expect(attr).toBe("plaintext-only");
  });
});

// ─────────────────────────────────────────────────────────
// US-21: Enter inserts newline in multiline Fields
// ─────────────────────────────────────────────────────────
test.describe("US-21: Newlines in multiline Fields", () => {
  test("Multiline field accepts Enter key", async ({ page }) => {
    await enterEditMode(page, "/");

    const introSection = page.locator('[data-testid="intro-section"]');
    await introSection.scrollIntoViewIfNeeded();

    const multilineField = introSection.locator(
      'p.editable-field[style*="white-space"]'
    );
    await expect(multilineField.first()).toBeAttached({ timeout: 15_000 });

    if ((await multilineField.count()) > 0) {
      const textBefore = await multilineField.first().textContent();
      await multilineField.first().click();
      await page.keyboard.press("End");
      await page.keyboard.press("Enter");
      await page.keyboard.type("new line");
      const textAfter = await multilineField.first().textContent();
      expect((textAfter ?? "").length).toBeGreaterThan(
        (textBefore ?? "").length
      );
    }
  });
});

// ─────────────────────────────────────────────────────────
// US-22: Hero title first-line styling via CSS ::first-line
// ─────────────────────────────────────────────────────────
test.describe("US-22: Hero title first-line styling", () => {
  test("Hero title has hero-title class for ::first-line CSS", async ({
    page,
  }) => {
    await page.goto("/en");
    await waitForApp(page);

    const heroTitle = page.locator(".hero-title");
    await expect(heroTitle).toBeAttached({ timeout: 10_000 });

    const hasClass = await heroTitle.evaluate((el) =>
      el.classList.contains("hero-title")
    );
    expect(hasClass).toBe(true);
  });

  test("Hero title maintains styling during editing", async ({ page }) => {
    await enterEditMode(page, "/");

    const heroTitle = page.locator(".hero-title");
    await expect(heroTitle).toBeAttached();

    const hasClass = await heroTitle.evaluate((el) =>
      el.classList.contains("hero-title")
    );
    expect(hasClass).toBe(true);

    const inner = heroTitle.locator(".editable-field");
    const isEditable = await inner.getAttribute("contenteditable");
    expect(isEditable).toBe("plaintext-only");
  });
});

// ─────────────────────────────────────────────────────────
// US-24: Rapid edit-mode toggle
// ─────────────────────────────────────────────────────────
test.describe("US-24: Rapid edit mode toggle", () => {
  test("Edit mode works correctly after multiple page loads with toggle", async ({
    page,
  }) => {
    await enterEditMode(page, "/en");
    await waitForChromeRects(page);

    const rectsOn = await chromeRects(page).count();
    expect(rectsOn).toBeGreaterThan(0);

    await page.goto("/en");
    await waitForApp(page);
    await waitForChromeRects(page);

    const rectsAfter = await chromeRects(page).count();
    expect(rectsAfter).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────
// Toolbar integration
// ─────────────────────────────────────────────────────────
test.describe("Toolbar integration", () => {
  test("Toolbar is visible in edit mode with drag handle", async ({ page }) => {
    await enterEditMode(page, "/");

    const toolbar = editToolbar(page);
    const dragHandle = toolbar.getByLabel("Drag toolbar");
    await expect(dragHandle).toBeAttached();
  });

  test("Toolbar has exit edit mode button (via tooltip)", async ({ page }) => {
    await enterEditMode(page, "/");

    const toolbar = editToolbar(page);
    const toolbarButtons = toolbar.locator("button");
    const count = await toolbarButtons.count();
    expect(count).toBeGreaterThanOrEqual(4);
  });

  test("Toolbar buttons should have accessible labels", async ({ page }) => {
    await enterEditMode(page, "/");

    const toolbar = editToolbar(page);
    const buttonsWithLabel = toolbar.locator("button[aria-label]");
    const labelCount = await buttonsWithLabel.count();

    const allButtons = toolbar.locator("button");
    const totalButtons = await allButtons.count();

    expect(labelCount).toBe(totalButtons);
  });
});

// ─────────────────────────────────────────────────────────
// UnsavedChangesGuard
// ─────────────────────────────────────────────────────────
test.describe("UnsavedChangesGuard", () => {
  test("Exiting edit mode with unsaved changes shows guard dialog", async ({
    page,
  }) => {
    await enterEditMode(page, "/");

    const field = editableFields(page).first();
    await field.click();
    await page.keyboard.type("U");
    await field.blur();

    const toolbar = editToolbar(page);
    await expect(toolbar.getByText("Save")).toBeVisible({ timeout: 5000 });
    const exitButton = toolbar.locator('button[aria-label="Exit edit mode"]');
    await exitButton.click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await expect(
      dialog.getByRole("heading", { name: "Unsaved changes" })
    ).toBeVisible();

    await expect(dialog.getByRole("button", { name: "Save" })).toBeAttached();
    await expect(
      dialog.getByRole("button", { name: "Discard" })
    ).toBeAttached();
    await expect(dialog.getByRole("button", { name: "Stay" })).toBeAttached();
  });
});

// ─────────────────────────────────────────────────────────
// Cross-page editing
// ─────────────────────────────────────────────────────────
test.describe("Cross-page editing", () => {
  test("Edit mode persists across page navigation", async ({ page }) => {
    await enterEditMode(page, "/");

    const fieldsBefore = await editableFields(page).count();
    expect(fieldsBefore).toBeGreaterThan(0);

    await page.click('a[href*="/essence"]');
    await page.waitForURL("**/essence");
    await waitForApp(page);
    await expect(editableFields(page).first()).toBeAttached({
      timeout: 15_000,
    });

    const fieldsAfter = await editableFields(page).count();
    expect(fieldsAfter).toBeGreaterThan(0);
  });

  test("Essence page has editable Fields", async ({ page }) => {
    await enterEditMode(page, "/en/essence");

    const fields = editableFields(page);
    const count = await fields.count();
    expect(count).toBeGreaterThan(0);
  });

  test("Connect page has editable Fields", async ({ page }) => {
    await enterEditMode(page, "/en/connect");

    const fields = editableFields(page);
    const count = await fields.count();
    expect(count).toBeGreaterThan(0);
  });

  test("Typing space in availability message does not toggle availability", async ({
    page,
  }) => {
    await enterEditMode(page, "/en/connect");

    const availability = page.getByTestId("availability-toggle");
    await expect(availability).toBeVisible({ timeout: 15_000 });

    const status = availability.getByTestId("availability-status");
    const statusBefore = await status.textContent();
    expect(statusBefore).toBeTruthy();

    const message = availability.locator(".editable-field").first();
    await expect(message).toBeVisible({ timeout: 15_000 });
    const textBefore = await message.evaluate((el) => el.textContent ?? "");

    await message.click();
    await message.evaluate((el) => {
      const range = document.createRange();
      range.selectNodeContents(el);
      range.collapse(false);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
    });
    await page.keyboard.press("Space");

    await expect(status).toHaveText(statusBefore ?? "");
    const textAfter = await message.evaluate((el) => el.textContent ?? "");
    expect(textAfter.length).toBeGreaterThan(textBefore.length);
  });
});
