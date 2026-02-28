/**
 * E2E regression tests: Genre & Platforms sections must be visible
 * on Home, Live, and Search tabs (both / and /prototype routes).
 *
 * These tests FAIL on the broken state (commit 19876e3 and earlier where
 * overflow:hidden on the Filters container caused a 34px height clip)
 * and PASS after the fix (overflow:hidden removed).
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
 * Assert that the Filters container (first child of <main>) contains
 * "Genre" and "Platforms" text AND has a rendered height > 200 px
 * (i.e. not clipped to a single header row).
 */
async function assertFiltersVisible(page: Page) {
  const info = await page.evaluate(() => {
    const main = document.querySelector("main");
    if (!main) return { error: "no <main>" };

    const filters = main.children[0] as HTMLElement | undefined;
    if (!filters) return { error: "no first child of <main>" };

    const rect = filters.getBoundingClientRect();
    const text = filters.textContent ?? "";

    return {
      height: rect.height,
      hasFilters: text.includes("Filters"),
      hasGenre: text.includes("Genre"),
      hasPlatforms: text.includes("Platforms"),
    };
  });

  expect(info).not.toHaveProperty("error");
  expect((info as any).hasFilters).toBe(true);
  expect((info as any).hasGenre).toBe(true);
  expect((info as any).hasPlatforms).toBe(true);
  // The container should be tall enough that Genre + Platforms are not
  // clipped (broken state was 34 px; fixed state is ~410+ px).
  expect((info as any).height).toBeGreaterThan(200);
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
