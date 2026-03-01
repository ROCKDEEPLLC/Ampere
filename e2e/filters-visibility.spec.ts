/**
 * E2E regression tests: Genre & Platforms sections must be visible
 * on Home, Live, and Search tabs (both / and /prototype routes).
 *
 * These tests use data-testid attributes added to the Filters, Genre,
 * and Platforms sections for reliable element identification.
 *
 * Run:  npx playwright test e2e/filters-visibility.spec.ts
 */
import { test, expect, type Page } from "@playwright/test";

/** Click "Power On" and wait for the boot overlay to disappear. */
async function bootApp(page: Page) {
  const powerOn = page.locator('button:has-text("Power On")');
  if ((await powerOn.count()) > 0) {
    await powerOn.click();
    // Wait for the fixed z-index:200 overlay to be removed from the DOM
    await page
      .waitForFunction(
        () => {
          for (const el of document.querySelectorAll("div")) {
            if (
              el.style.zIndex === "200" &&
              el.style.position === "fixed"
            )
              return false;
          }
          return true;
        },
        { timeout: 15_000 },
      )
      .catch(() => {
        /* boot video may not play in CI; continue */
      });
  }
  // Allow one React render cycle after the overlay disappears
  await page.waitForTimeout(1000);
}

/**
 * Assert that the Filters container exists, contains Genre and Platforms
 * sections, and has sufficient rendered height (not clipped).
 */
async function assertFiltersVisible(page: Page) {
  // 1. Filters container must exist and have height > 200px
  const filters = page.locator('[data-testid="filters-container"]');
  await expect(filters).toBeVisible({ timeout: 5000 });
  const filtersBox = await filters.boundingBox();
  expect(filtersBox).not.toBeNull();
  expect(filtersBox!.height).toBeGreaterThan(200);

  // 2. Genre section must exist and be visible
  const genre = page.locator('[data-testid="genre-section"]');
  await expect(genre).toBeVisible();
  const genreBox = await genre.boundingBox();
  expect(genreBox).not.toBeNull();
  expect(genreBox!.height).toBeGreaterThan(20);

  // 3. Platforms section must exist and be visible
  const platforms = page.locator('[data-testid="platforms-section"]');
  await expect(platforms).toBeVisible();
  const platformsBox = await platforms.boundingBox();
  expect(platformsBox).not.toBeNull();
  expect(platformsBox!.height).toBeGreaterThan(20);

  // 4. Genre/Platforms text must be in the Filters container
  await expect(filters).toContainText("Genre");
  await expect(filters).toContainText("Platforms");
  await expect(filters).toContainText("Filters");

  // 5. Invariant banner must NOT be visible (if it shows, the bug is present)
  const banner = page.locator('[data-testid="filters-invariant-banner"]');
  await expect(banner).not.toBeVisible();
}

for (const route of ["/", "/prototype"]) {
  test.describe(`Route ${route}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(route, { waitUntil: "networkidle" });
      await bootApp(page);
    });

    test("Home tab shows Genre and Platforms", async ({ page }) => {
      // Home is the default tab — no click needed
      await assertFiltersVisible(page);
    });

    test("Live tab shows Genre and Platforms", async ({ page }) => {
      await page.locator('button[aria-label="Live tab"]').click();
      await page.waitForTimeout(400);
      await assertFiltersVisible(page);
    });

    test("Search tab shows Genre and Platforms", async ({ page }) => {
      await page.locator('button[aria-label="Search tab"]').click();
      await page.waitForTimeout(400);
      await assertFiltersVisible(page);
    });
  });
}
