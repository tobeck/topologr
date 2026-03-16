import { test, expect } from "@playwright/test";

// Graph tests run serially — they share DB state
test.describe.configure({ mode: "serial" });

test.describe("Graph Page", () => {
  test("import example data", async ({ page }) => {
    await page.goto("/import");
    await page.getByRole("button", { name: /load an example/i }).click();
    await page.getByRole("button", { name: /^import$/i }).click();
    await expect(page.getByText(/success/i)).toBeVisible({ timeout: 10000 });
  });

  test("renders the graph with SVG", async ({ page }) => {
    await page.goto("/graph");

    // Target the graph SVG specifically (full-size SVG inside the graph container)
    const graphSvg = page.locator("svg.w-full.h-full");
    await expect(graphSvg).toBeVisible({ timeout: 10000 });

    // Wait for D3 to finish rendering nodes into the SVG
    await expect(graphSvg.locator("g")).toHaveCount(1, { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(2000);

    // D3 renders a top-level <g> group for zoom, with child elements inside
    const children = await graphSvg.evaluate((svg) => svg.childElementCount);
    expect(children).toBeGreaterThan(0);
  });

  test("graph controls are visible", async ({ page }) => {
    await page.goto("/graph");
    await expect(page.locator("svg.w-full.h-full")).toBeVisible({ timeout: 10000 });

    // Controls are icon-only buttons in a positioned container
    const controlButtons = page.locator(
      ".absolute.top-4.right-4 button"
    );
    const count = await controlButtons.count();
    expect(count).toBe(4); // zoom in, zoom out, reset, impact toggle
  });

  test("impact mode can be toggled", async ({ page }) => {
    await page.goto("/graph");
    await expect(page.locator("svg.w-full.h-full")).toBeVisible({ timeout: 10000 });

    // The impact button is the last control button
    const controlButtons = page.locator(
      ".absolute.top-4.right-4 button"
    );
    const impactButton = controlButtons.last();
    await impactButton.click();

    // In impact mode, the button should switch to destructive variant
    await expect(impactButton).toHaveClass(/destructive/);

    // Toggle off
    await impactButton.click();
    await expect(impactButton).not.toHaveClass(/destructive/);
  });

  test("empty graph shows import prompt", async ({ page }) => {
    // Delete all services via API
    const response = await page.request.get("/api/services");
    const services = await response.json();
    for (const svc of services) {
      await page.request.delete(`/api/services/${svc.id}`);
    }

    await page.goto("/graph");
    await expect(
      page.getByText(/no services|import|get started/i)
    ).toBeVisible({ timeout: 10000 });
  });
});
