import { test, expect } from "@playwright/test";

test.describe("Public navigation", () => {
  test("home page shows Business OS and primary actions", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toContainText("Business OS");
    await expect(
      page.getByRole("link", { name: /sign in|log in/i })
    ).toBeVisible();
  });

  test("navigating from home to login works", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /sign in|log in/i }).click();
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();
  });

  test("navigating from login to signup works", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("link", { name: /sign up|create account/i }).click();
    await expect(page).toHaveURL(/\/signup/);
    await expect(
      page.getByRole("heading", { name: /create an account/i })
    ).toBeVisible();
  });
});

test.describe("Org routes require auth", () => {
  const fakeOrgId = "00000000-0000-0000-0000-000000000001";

  test("visiting org home without auth redirects to login", async ({
    page,
  }) => {
    await page.goto(`/${fakeOrgId}`);
    await expect(page).toHaveURL(/\/login/);
  });

  test("visiting org leads without auth redirects to login", async ({
    page,
  }) => {
    await page.goto(`/${fakeOrgId}/leads`);
    await expect(page).toHaveURL(/\/login/);
  });

  test("visiting org settings without auth redirects to login", async ({
    page,
  }) => {
    await page.goto(`/${fakeOrgId}/settings`);
    await expect(page).toHaveURL(/\/login/);
  });
});
