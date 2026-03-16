import { test, expect } from "@playwright/test";

test.describe("Navigation", () => {
  test("landing page loads with correct heading and CTAs", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Topologr" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Open Graph" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Import YAML" })).toBeVisible();
  });

  test("landing page links navigate to correct pages", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("link", { name: "Open Graph" }).click();
    await expect(page).toHaveURL(/\/graph/);

    await page.goto("/");
    await page.getByRole("link", { name: "Import YAML" }).click();
    await expect(page).toHaveURL(/\/import/);
  });

  test("sidebar navigation works across dashboard pages", async ({ page }) => {
    await page.goto("/graph");

    // Use exact name to avoid matching sidebar example links
    await page.getByRole("link", { name: "Services", exact: true }).click();
    await expect(page).toHaveURL(/\/services/);

    await page.getByRole("link", { name: "Import", exact: true }).click();
    await expect(page).toHaveURL(/\/import/);

    await page.getByRole("link", { name: "Graph", exact: true }).click();
    await expect(page).toHaveURL(/\/graph/);
  });

  test("sidebar highlights active page", async ({ page }) => {
    await page.goto("/graph");
    const graphLink = page.getByRole("link", { name: "Graph", exact: true });
    await expect(graphLink).toHaveClass(/bg-accent/);

    await page.goto("/services");
    const servicesLink = page.getByRole("link", { name: "Services", exact: true });
    await expect(servicesLink).toHaveClass(/bg-accent/);
  });
});
