import { test, expect } from "@playwright/test";

test("home page loads and shows key content", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("h1")).toContainText("Business OS");
});

test("login page loads and shows sign in", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();
});
