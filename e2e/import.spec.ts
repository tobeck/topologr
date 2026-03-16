import { test, expect } from "@playwright/test";

test.describe("Import Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/import");
  });

  test("page loads with heading and empty editor", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /import services/i })
    ).toBeVisible();
    const textarea = page.getByRole("textbox");
    await expect(textarea).toBeVisible();
    await expect(textarea).toHaveValue("");
  });

  test("load example populates the editor", async ({ page }) => {
    await page.getByRole("button", { name: /load an example/i }).click();
    const textarea = page.getByRole("textbox");
    await expect(textarea).not.toHaveValue("");
    const value = await textarea.inputValue();
    expect(value).toContain("services:");
  });

  test("clear button empties the editor", async ({ page }) => {
    await page.getByRole("button", { name: /load an example/i }).click();
    const textarea = page.getByRole("textbox");
    await expect(textarea).not.toHaveValue("");

    await page.getByRole("button", { name: /clear/i }).click();
    await expect(textarea).toHaveValue("");
  });

  test("import button is disabled when editor is empty", async ({ page }) => {
    const importButton = page.getByRole("button", { name: /^import$/i });
    await expect(importButton).toBeDisabled();
  });

  test("import valid YAML shows success", async ({ page }) => {
    const yaml = `services:
  - id: test-svc
    name: Test Service
    type: service
    tier: medium
connections: []`;

    await page.getByRole("textbox").fill(yaml);
    await page.getByRole("button", { name: /^import$/i }).click();

    await expect(page.getByText(/success/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/1 service/i)).toBeVisible();
  });

  test("import invalid YAML shows error", async ({ page }) => {
    await page.getByRole("textbox").fill("not: valid: yaml: [");
    await page.getByRole("button", { name: /^import$/i }).click();

    await expect(page.getByText(/error|failed|invalid/i)).toBeVisible({
      timeout: 10000,
    });
  });

  test("import example YAML and navigate to graph", async ({ page }) => {
    await page.getByRole("button", { name: /load an example/i }).click();
    await page.getByRole("button", { name: /^import$/i }).click();

    await expect(page.getByText(/success/i)).toBeVisible({ timeout: 10000 });

    // Use "View Graph" link from the success message, not the sidebar
    await page.getByRole("link", { name: /view graph/i }).click();
    await expect(page).toHaveURL(/\/graph/);
  });
});
