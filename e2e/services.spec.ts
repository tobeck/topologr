import { test, expect } from "@playwright/test";

// Services tests run serially — they share DB state
test.describe.configure({ mode: "serial" });

test.describe("Services Page", () => {
  test("import example data", async ({ page }) => {
    await page.goto("/import");
    await page.getByRole("button", { name: /load an example/i }).click();
    await page.getByRole("button", { name: /^import$/i }).click();
    await expect(page.getByText(/success/i)).toBeVisible({ timeout: 10000 });
  });

  test("displays services in table", async ({ page }) => {
    await page.goto("/services");
    await expect(page.getByRole("table")).toBeVisible({ timeout: 10000 });

    const rows = page.getByRole("table").locator("tbody tr");
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
  });

  test("search filters services by name", async ({ page }) => {
    await page.goto("/services");
    await expect(page.getByRole("table")).toBeVisible({ timeout: 10000 });

    const searchInput = page.getByPlaceholder(/search/i);
    await searchInput.fill("Auth");

    const rows = page.getByRole("table").locator("tbody tr");
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(1);
    await expect(rows.first()).toContainText(/auth/i);
  });

  test("filter by tier shows only matching services", async ({ page }) => {
    await page.goto("/services");
    await expect(page.getByRole("table")).toBeVisible({ timeout: 10000 });

    const totalBefore = await page
      .getByRole("table")
      .locator("tbody tr")
      .count();

    // Click the tier filter and select "critical"
    await page.getByRole("combobox").filter({ hasText: /tier/i }).click();
    await page.getByRole("option", { name: /critical/i }).click();

    const rows = page.getByRole("table").locator("tbody tr");
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThan(totalBefore);
  });

  test("clear filters resets the table", async ({ page }) => {
    await page.goto("/services");
    await expect(page.getByRole("table")).toBeVisible({ timeout: 10000 });

    const totalBefore = await page
      .getByRole("table")
      .locator("tbody tr")
      .count();

    // Apply a search filter
    await page.getByPlaceholder(/search/i).fill("Auth");
    const filteredCount = await page
      .getByRole("table")
      .locator("tbody tr")
      .count();
    expect(filteredCount).toBeLessThan(totalBefore);

    // Clear filters
    await page.getByRole("button", { name: /clear/i }).click();
    const resetCount = await page
      .getByRole("table")
      .locator("tbody tr")
      .count();
    expect(resetCount).toBe(totalBefore);
  });

  test("clicking a service row opens detail panel", async ({ page }) => {
    await page.goto("/services");
    await expect(page.getByRole("table")).toBeVisible({ timeout: 10000 });

    await page.getByRole("table").locator("tbody tr").first().click();
    await expect(page.getByRole("dialog")).toBeVisible();
  });
});
